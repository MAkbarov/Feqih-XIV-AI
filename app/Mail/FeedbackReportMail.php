<?php

namespace App\Mail;

use App\Models\Settings;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FeedbackReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public $feedbackData;
    public $themeColors;

    /**
     * Create a new message instance.
     */
    public function __construct($feedbackData)
    {
        $this->feedbackData = $feedbackData;
        $this->themeColors = [
            'primary' => Settings::get('primary_color', '#10b981'),
            'secondary' => Settings::get('secondary_color', '#059669'),
            'accent' => Settings::get('accent_color', '#8B5CF6'),
            'background' => Settings::get('background_gradient', 'linear-gradient(135deg, #10b981, #065f46)'),
            'text' => Settings::get('text_color', '#1f2937'),
'site_name' => Settings::get('site_name', 'XIV AI Chatbot Platform'),
        ];
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'AI Cavab Haqqında Səhv Bildiriş',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.feedback-report',
            with: [
                'feedbackData' => $this->feedbackData,
                'themeColors' => $this->themeColors,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

