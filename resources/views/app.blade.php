<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-screen bg-gray-50">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Bank Santri - Pesantren Digital</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Global Config & SSO Bridge -->
    <script>
        window.config = {
            portal_url: "{{ config('app.portal_url') }}",
            bank_url: "{{ config('app.bank_santri_url') }}"
        };

        // SSO Bridge: Capture token from URL and save to localStorage
        (function() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (token) {
                localStorage.setItem('token', token);
                // Clean the URL to hide the token
                const nextURL = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, nextURL);
            }
        })();
    </script>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="h-screen font-sans antialiased text-gray-900 overflow-hidden">
    <div id="app" class="h-full"></div>
</body>
</html>
