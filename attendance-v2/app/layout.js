import './globals.css';

export const metadata = {
    title: '學員管理系統 v2',
    description: '點名及學員管理系統',
    icons: {
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>"
    }
};

export const viewport = {
    width: 'device-width',
    initialScale: 1
};

export default function RootLayout({ children }) {
    return (
        <html lang="zh-TW">
            <body>{children}</body>
        </html>
    );
}
