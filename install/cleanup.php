<?php
/**
 * XIV AI - Cleanup Installer Directory
 * Bu fayl quraşdırmadan sonra installer qovluğunu silir
 */

// Only allow POST requests for security
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

header('Content-Type: application/json');

try {
    $installDir = __DIR__;
    $basePath = dirname($installDir);
    
    // Check if system is actually installed first
    $lockFile = $basePath . '/storage/installed.lock';
    if (!file_exists($lockFile)) {
        throw new Exception('Sistem quraşdırılmamış, installer silə bilmərik');
    }
    
    // Function to recursively delete directory
    function deleteDirectory($dir) {
        if (!is_dir($dir)) {
            return false;
        }
        
        $files = array_diff(scandir($dir), array('.', '..'));
        foreach ($files as $file) {
            $filePath = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($filePath)) {
                deleteDirectory($filePath);
            } else {
                @unlink($filePath);
            }
        }
        
        return @rmdir($dir);
    }
    
    // Try to delete the install directory
    $success = deleteDirectory($installDir);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Installer qovluğu uğurla silindi'
        ]);
    } else {
        // If we can't delete the directory, at least try to rename it
        $backupName = $installDir . '_backup_' . date('Y_m_d_H_i_s');
        if (@rename($installDir, $backupName)) {
            echo json_encode([
                'success' => true,
                'message' => 'Installer qovluğu yenidən adlandırıldı: ' . basename($backupName)
            ]);
        } else {
            throw new Exception('Installer qovluğu silinə və ya yenidən adlandırıla bilmədi. Manual silmə lazımdır.');
        }
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>