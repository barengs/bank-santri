<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = Activity::with('causer')
            ->orderBy('created_at', 'desc');

        if ($request->log_name) {
            $logs->where('log_name', $request->log_name);
        }

        if ($request->causer_id) {
            $logs->where('causer_id', $request->causer_id);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $logs->paginate(20)
        ]);
    }

    public function show($id)
    {
        $log = Activity::with('causer', 'subject')->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data'   => $log
        ]);
    }
}
