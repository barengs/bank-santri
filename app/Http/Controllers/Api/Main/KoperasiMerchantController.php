<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\KoperasiMerchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class KoperasiMerchantController extends Controller
{
    public function index()
    {
        $merchants = KoperasiMerchant::with('creator:id,name')->get();
        return response()->json([
            'status' => 'success',
            'data' => $merchants
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $rawKey = 'KOP-' . Str::random(32);

        $merchant = KoperasiMerchant::create([
            'name' => $request->name,
            'api_key_hash' => Hash::make($rawKey),
            'notes' => $request->notes,
            'created_by' => auth('api')->id(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Merchant berhasil dibuat.',
            'data' => $merchant,
            'api_key' => $rawKey, // Only shown once
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $merchant = KoperasiMerchant::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean',
            'notes' => 'nullable|string',
        ]);

        $merchant->update($request->only(['name', 'is_active', 'notes']));

        return response()->json([
            'status' => 'success',
            'message' => 'Merchant berhasil diperbarui.',
            'data' => $merchant
        ]);
    }

    public function destroy($id)
    {
        $merchant = KoperasiMerchant::findOrFail($id);
        $merchant->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Merchant berhasil dihapus.'
        ]);
    }

    public function rotateKey($id)
    {
        $merchant = KoperasiMerchant::findOrFail($id);
        $rawKey = 'KOP-' . Str::random(32);

        $merchant->update([
            'api_key_hash' => Hash::make($rawKey),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'API Key berhasil di-generate ulang.',
            'api_key' => $rawKey, // Only shown once
        ]);
    }
}
