<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /**
     * Ambil semua setting (secret values disembunyikan)
     */
    public function index()
    {
        $settings = Setting::all()->map(function ($s) {
            return [
                'id'        => $s->id,
                'key'       => $s->key,
                'value'     => $s->is_secret ? '••••••••' : $s->value,
                'group'     => $s->group,
                'label'     => $s->label,
                'is_secret' => $s->is_secret,
            ];
        })->groupBy('group');

        return response()->json(['status' => 'success', 'data' => $settings]);
    }

    /**
     * Update satu atau banyak setting sekaligus
     * Body: { "settings": [{ "key": "midtrans_server_key", "value": "xxx" }] }
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'settings'          => 'required|array|min:1',
            'settings.*.key'    => 'required|string|max:100',
            'settings.*.value'  => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $allowed = [
            'midtrans_server_key', 'midtrans_client_key', 'midtrans_merchant_id',
            'midtrans_is_production',
            'koperasi_api_key', 'koperasi_outlet_name',
            'pesantren_name', 'pesantren_address', 'pesantren_phone',
        ];

        $updated = [];
        foreach ($request->settings as $item) {
            if (!in_array($item['key'], $allowed)) continue;
            Setting::set($item['key'], $item['value']);
            $updated[] = $item['key'];
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan berhasil disimpan.',
            'updated' => $updated,
        ]);
    }
}
