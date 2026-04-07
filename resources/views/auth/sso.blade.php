<!DOCTYPE html>
<html>
<head>
    <title>Handing over session... - Bank Santri</title>
</head>
<body style="background: #0f172a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <div style="text-align: center;">
        <div style="margin-bottom: 20px;">Memasuki Bank Santri...</div>
        <div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: auto;"></div>
    </div>

    <script>
        const token = "{{ $token }}";
        if (token) {
            localStorage.setItem('token', token);
            // Optional: Store user info if helpful for initial UX
            @if(isset($user))
                localStorage.setItem('user', JSON.stringify({
                    id: "{{ $user->id }}",
                    name: "{{ $user->name }}",
                    email: "{{ $user->email }}",
                    role: "{{ $user->role }}"
                }));
            @endif
        }
        
        // Final Handover to the React Dashboard
        window.location.href = '/';
    </script>

    <style>
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</body>
</html>
