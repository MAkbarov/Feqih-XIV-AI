<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeCategory;
use Illuminate\Http\Request;

class KnowledgeCategoryController extends Controller
{
    public function index()
    {
        $items = KnowledgeCategory::orderBy('sort_order')->orderBy('name')->get();
        return response()->json([
            'success' => true,
            'items' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'key' => 'required|string|max:50|alpha_dash|unique:knowledge_categories,key',
            'name' => 'required|string|max:100',
            'locale' => 'nullable|string|max:10',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0'
        ]);
        $item = KnowledgeCategory::create([
            'key' => $data['key'],
            'name' => $data['name'],
            'locale' => $data['locale'] ?? app()->getLocale(),
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
        return response()->json(['success' => true, 'item' => $item]);
    }

    public function update(Request $request, KnowledgeCategory $category)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'locale' => 'nullable|string|max:10',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0'
        ]);
        $category->update($data);
        return response()->json(['success' => true, 'item' => $category->fresh()]);
    }

    public function destroy(KnowledgeCategory $category)
    {
        $category->delete();
        return response()->json(['success' => true]);
    }
}
