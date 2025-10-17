<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KnowledgeBaseChunk extends Model
{
    use HasFactory;

    protected $fillable = [
        'knowledge_base_id',
        'content',
        'char_count',
        'chunk_index',
        'vector_id',
    ];

    protected $casts = [
        'knowledge_base_id' => 'integer',
        'char_count' => 'integer',
        'chunk_index' => 'integer',
    ];

    /**
     * Relationship: Chunk belongs to Knowledge Base
     */
    public function knowledgeBase()
    {
        return $this->belongsTo(KnowledgeBase::class, 'knowledge_base_id');
    }
}
