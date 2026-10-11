<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'label',
        'is_secret',
    ];

    protected $casts = [
        'is_secret' => 'boolean',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    /**
     * Ambil setting berupa JSON array, di-cache di RAM/Redis.
     * Nol query database pada transaksi beruntun (jam sibuk kasir).
     */
    public static function getTiers(string $key, array $default = []): array
    {
        $raw = Cache::rememberForever("setting:{$key}", function () use ($key) {
            $value = static::where('key', $key)->value('value');
            if ($value === null) {
                return null;
            }
            $decoded = json_decode((string) $value, true);
            return is_array($decoded) ? $decoded : null;
        });

        if (!is_array($raw) || $raw === null) {
            return $default;
        }

        // Normalisasi: pastikan tiap tier punya min & limit, max boleh null
        $tiers = [];
        foreach ($raw as $tier) {
            if (!is_array($tier)) continue;
            $min = $tier['min'] ?? null;
            $limit = $tier['limit'] ?? null;
            if ($min === null || $limit === null) continue;
            $tiers[] = [
                'min'   => (float) $min,
                'max'   => isset($tier['max']) ? (float) $tier['max'] : null,
                'limit' => (float) $limit,
            ];
        }

        return $tiers ?: $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
        // Invalidasi cache agar perubahan setting berlaku langsung
        Cache::forget("setting:{$key}");
    }
}
