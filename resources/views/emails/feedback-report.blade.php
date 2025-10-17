<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI Cavab Haqqında Səhv Bildiriş</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: {{ $themeColors['background'] }};
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
.message-box {
            background: #f8fafc;
            border-left: 4px solid {{ $themeColors['primary'] }};
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
        }
        .info-section {
            background: #f1f5f9;
            padding: 15px;
            margin: 15px 0;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .info-label {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 5px;
        }
        .info-value {
            color: #475569;
            background: white;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
        }
        .footer {
            background: #f8fafc;
            padding: 15px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
        }
        .timestamp {
            color: #6b7280;
            font-size: 14px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 AI Cavab Haqqında Səhv Bildiriş</h1>
        </div>
        
        <div class="content">
            <p>İstifadəçi AI assistantın səhv/xətalı cavab verdiyini bildirdi.</p>
            
            @if(!empty($feedbackData['user_message']))
            <div class="message-box">
                <div class="info-label">İstifadəçi/Qonaq Mesajı:</div>
                <div class="info-value">{{ $feedbackData['user_message'] }}</div>
            </div>
            @endif

            <div class="message-box">
                <div class="info-label">AI Cavabı (bildirilən):</div>
                <div class="info-value">{{ $feedbackData['assistant_message'] ?? $feedbackData['message_content'] }}</div>
            </div>
            
            <div class="info-section">
                <div class="info-label">Bildiriş Tarixi və Saatı:</div>
                <div class="info-value timestamp">{{ $feedbackData['reported_at'] }}</div>
            </div>
            
            @if($feedbackData['timestamp'])
            <div class="info-section">
                <div class="info-label">Mesajın Orjinal Tarixi:</div>
                <div class="info-value timestamp">
                    {{ \Carbon\Carbon::parse($feedbackData['timestamp'])->format('d.m.Y H:i:s') }}
                </div>
            </div>
            @endif
            
            <div class="info-section">
                <div class="info-label">İstifadəçi Məlumatı:</div>
                <div class="info-value">
                    @if(is_array($feedbackData['user_info']))
                        <strong>Ad:</strong> {{ $feedbackData['user_info']['name'] }}<br>
                        <strong>Email:</strong> {{ $feedbackData['user_info']['email'] }}
                    @else
                        {{ $feedbackData['user_info'] }}
                    @endif
                </div>
            </div>
            
            @if($feedbackData['session_id'])
            <div class="info-section">
                <div class="info-label">Session ID:</div>
                <div class="info-value">{{ $feedbackData['session_id'] }}</div>
            </div>
            @endif
            
            @if($feedbackData['message_id'])
            <div class="info-section">
                <div class="info-label">Message ID:</div>
                <div class="info-value">{{ $feedbackData['message_id'] }}</div>
            </div>
            @endif
            
            <div class="info-section">
                <div class="info-label">IP Ünvan:</div>
                <div class="info-value">{{ $feedbackData['ip_address'] }}</div>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Bu bildiriş AI sisteminizin performansını təkmilləşdirmək üçün göndərilmişdir. 
                Zəhmət olmasa bu cavabı yoxlayın və lazım gələrsə AI təlimində düzəlişlər edin.
            </p>
        </div>
        
        <div class="footer">
            Bu email avtomatik olaraq {{ $themeColors['site_name'] }} sistemi tərəfindən göndərilmişdir.
        </div>
    </div>
</body>
</html>
