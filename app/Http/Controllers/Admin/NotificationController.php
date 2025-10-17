<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use App\Http\Controllers\Admin\Traits\HasFooterData;

class NotificationController extends Controller
{
    use HasFooterData;
    private function getStore(): array
    {
        $raw = Settings::get('admin_notifications', '[]');
        $arr = json_decode($raw ?: '[]', true);
        return is_array($arr) ? $arr : [];
    }
    private function saveStore(array $items): void
    {
        Settings::set('admin_notifications', json_encode($items));
    }

    public function index(): Response
    {
        $items = $this->getStore();
        usort($items, fn($a,$b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
        $page = max(1, (int) request('page', 1));
        $perPage = max(1, (int) request('per_page', 20));
        $total = count($items);
        $pages = (int) ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;
        $paged = array_slice($items, $offset, $perPage);
        return Inertia::render('Admin/Notifications', $this->addFooterDataToResponse([
            'notifications' => $paged,
            'page' => $page,
            'pages' => $pages,
            'per_page' => $perPage,
            'total' => $total,
        ]));
    }

    public function recent()
    {
        $items = $this->getStore();
        usort($items, fn($a,$b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
        return response()->json(array_slice($items, 0, 5));
    }

    public function stats()
    {
        $items = $this->getStore();
        $unread = array_values(array_filter($items, fn($n) => empty($n['read'])));
        return response()->json([ 'unread_count' => count($unread), 'total' => count($items) ]);
    }

    public function markAsRead($id)
    {
        $items = $this->getStore();
        foreach ($items as &$n) { if (($n['id'] ?? null) === $id) { $n['read'] = true; } }
        $this->saveStore($items);
        return response()->json(['success' => true]);
    }

    public function markAsImportant($id)
    {
        $items = $this->getStore();
        foreach ($items as &$n) { if (($n['id'] ?? null) === $id) { $n['important'] = true; } }
        $this->saveStore($items);
        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        $items = $this->getStore();
        foreach ($items as &$n) { $n['read'] = true; }
        $this->saveStore($items);
        return response()->json(['success' => true]);
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string|in:info,warning,error,feedback,system',
            'title' => 'required|string|max:200',
            'message' => 'nullable|string|max:2000',
            'link' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
        ]);
        $items = $this->getStore();
        $items[] = [
            'id' => (string) Str::uuid(),
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'] ?? null,
            'link' => $data['link'] ?? null,
            'icon' => $data['icon'] ?? null,
            'read' => false,
            'created_at' => now()->toIso8601String(),
        ];
        $this->saveStore($items);
        return response()->json(['success' => true]);
    }

    public function cleanExpired()
    {
        $items = $this->getStore();
        usort($items, fn($a,$b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
        $items = array_slice($items, 0, 500);
        $this->saveStore($items);
        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        $items = $this->getStore();
        $items = array_values(array_filter($items, fn($n) => ($n['id'] ?? null) !== $id));
        $this->saveStore($items);
        return response()->json(['success' => true]);
    }

    public function destroyAll()
    {
        $this->saveStore([]);
        return response()->json(['success' => true]);
    }
}
