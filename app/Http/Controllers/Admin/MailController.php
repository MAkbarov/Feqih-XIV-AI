<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AdminBulkMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MailController extends Controller
{
    public function bulkSend(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|min:3|max:200',
            'body_html' => 'required|string|min:3'
        ]);

        // Always send to all users (no verified filter)
        $scope = 'all';
        $subject = $validated['subject'];
        $body = $validated['body_html'];

        $query = User::query()
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->where('email_news_opt_in', true);

        $total = 0;
        $query->chunkById(200, function ($users) use (&$total, $subject, $body) {
            foreach ($users as $user) {
                try {
                    Mail::to($user->email)->send(new AdminBulkMail($subject, $body));
                    $total++;
                } catch (\Throwable $e) {
                    // Continue sending to others; optionally log
                    \Log::warning('Bulk mail send failed for '.$user->email.': '.$e->getMessage());
                }
            }
        });

        return response()->json([
            'success' => true,
            'sent_count' => $total,
            'message' => 'Toplu e-poçt göndərildi.'
        ]);
    }
}