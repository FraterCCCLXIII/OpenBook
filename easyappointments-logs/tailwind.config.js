module.exports = {
    content: [
        './application/views/layouts/booking_layout.php',
        './application/views/layouts/backend_layout.php',
        './application/views/components/booking_*.php',
        './application/views/components/*.php',
        './application/views/components/backend_header.php',
        './application/views/pages/*.php',
        './application/views/pages/customer_*.php',
        './assets/js/layouts/booking_layout.js',
        './assets/js/**/*.js',
        './assets/js/pages/booking.js',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#439a82',
                    dark: '#024225',
                },
            },
            fontFamily: {
                brand: ['"Libre Baskerville"', 'Baskerville', 'serif'],
            },
        },
    },
    plugins: [],
};
