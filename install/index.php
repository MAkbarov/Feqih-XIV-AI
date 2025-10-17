<?php declare(strict_types=1); 
header('X-Robots-Tag: noindex, nofollow', true); 
$target = '/install/setup.php'; 
if (!headers_sent()) { 
    header('Location: ' . $target, true, 302); 
    exit; 
}