<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\RAGQueryService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RAGChatController extends Controller
{
    protected RAGQueryService $ragService;

    public function __construct(RAGQueryService $ragService)
    {
        $this->ragService = $ragService;
    }

    /**
     * Query RAG system with user's question
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function query(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string|min:3|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Sual düzgün daxil edilməyib.',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            $question = $request->input('question');
            
            $result = $this->ragService->query($question, [
                'user_id' => auth()->id() ?? null
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'answer' => $result['answer'],
                    'sources' => $result['sources'],
                    'metadata' => $result['metadata']
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('RAG Query API Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
            ], 500);
        }
    }

    /**
     * Streaming query for RAG system (SSE)
     * 
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function queryStream(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string|min:3|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Sual düzgün daxil edilməyib.'
            ], 422);
        }

        return response()->stream(function () use ($request) {
            try {
                $question = $request->input('question');
                
                $metadata = $this->ragService->queryStreaming($question, function ($chunk) {
                    echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";
                    ob_flush();
                    flush();
                });

                // Send metadata at end
                echo "data: " . json_encode([
                    'done' => true,
                    'metadata' => $metadata
                ]) . "\n\n";
                ob_flush();
                flush();

            } catch (\Exception $e) {
                Log::error('RAG Streaming Query Error', [
                    'message' => $e->getMessage()
                ]);
                
                echo "data: " . json_encode([
                    'error' => 'Xəta baş verdi.'
                ]) . "\n\n";
                ob_flush();
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
