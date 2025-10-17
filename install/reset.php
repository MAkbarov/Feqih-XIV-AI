<?php
/**
 * XIV AI - Installer Reset Tool
 * Bu skript installer-i yenidən işlətmək üçün sistemi sıfırlayır
 */

$basePath = dirname(__DIR__);

// Files to remove for fresh installation
$filesToRemove = [
    $basePath . '/storage/installed.lock',
    $basePath . '/.env',
    $basePath . '/bootstrap/cache/config.php',
    $basePath . '/bootstrap/cache/routes-v7.php',
    $basePath . '/bootstrap/cache/services.php',
];

$removedFiles = [];
$errors = [];

foreach ($filesToRemove as $file) {
    if (file_exists($file)) {
        if (unlink($file)) {
            $removedFiles[] = basename($file);
        } else {
            $errors[] = "Cannot remove: " . basename($file);
        }
    }
}

?>
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XIV AI - Installer Reset</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
    <div class="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-gray-200 text-center">
        <div class="text-6xl mb-4">🔄</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Installer Sıfırlandı</h1>
        
        <?php if (!empty($removedFiles)): ?>
            <div class="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                <h3 class="font-semibold">Uğurla silindi:</h3>
                <ul class="text-sm mt-2">
                    <?php foreach ($removedFiles as $file): ?>
                        <li>• <?= htmlspecialchars($file) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($errors)): ?>
            <div class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                <h3 class="font-semibold">Xətalar:</h3>
                <ul class="text-sm mt-2">
                    <?php foreach ($errors as $error): ?>
                        <li>• <?= htmlspecialchars($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <p class="text-gray-600 mb-6">Installer indi təmiz quraşdırma üçün hazırdır.</p>
        
        <div class="space-y-3">
            <a href="setup.php" class="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-colors">
                Installer-i aç
            </a>
            <a href="../" class="block w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-colors">
                Ana səhifəyə qayıt
            </a>
        </div>
    </div>
</body>
</html>