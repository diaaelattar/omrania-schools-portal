import './globals.css';

export const metadata = {
  title: 'بوابة تجميع بيانات المدارس',
  description: 'موقع تجميع بيانات المدارس الدورية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 min-h-screen text-gray-900">{children}</body>
    </html>
  );
}
