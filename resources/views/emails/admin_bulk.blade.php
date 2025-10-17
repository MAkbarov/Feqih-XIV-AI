<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? '' }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <div style="max-width: 640px; margin: 0 auto; padding: 16px;">
        {!! $htmlBody !!}
        <hr style="margin-top:24px; border:none; border-top:1px solid #e5e7eb;">
        <p style="font-size:12px; color:#6b7280;">Bu mesaj admin paneldən toplu olaraq göndərilib.</p>
    </div>
</body>
</html>