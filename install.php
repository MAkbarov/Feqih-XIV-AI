<?php
declare(strict_types=1);

/**
 * XIV AI - Installer Redirect Stub
 * Version: 1.0
 * Author: DeXIV
 *
 * Purpose:
 * - Avoid legacy parse errors in old root-level install.php
 * - Redirects cleanly to the new installer UI under /install/setup.php
 */

// Prevent indexing
header('X-Robots-Tag: noindex, nofollow', true);

// Always redirect to the new installer
$target = '/install/setup.php';

if (!headers_sent()) {
    header('Location: ' . $target, true, 302);
    exit;
}
?>
<!doctype html>
<html lang="az">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($target, ENT_QUOTES, 'UTF-8') ?>">
  <title>XIV AI - Installer(quraşdırıcı) yönləndirmə</title>
</head>
<body>
  <p>Yönləndirilir: <a href="<?= htmlspecialchars($target, ENT_QUOTES, 'UTF-8') ?>">Quraşdırıcı...</a></p>
</body>
</html>