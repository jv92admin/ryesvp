import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Lark - Nights Start Here';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  // Load Space Grotesk 700 from Google Fonts
  const spaceGrotesk = await fetch(
    'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.ttf'
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0A',
          fontFamily: 'Space Grotesk',
        }}
      >
        {/* Subtle border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '1px solid #1A1A1A',
            display: 'flex',
          }}
        />

        {/* Bird mark */}
        <svg
          width="120"
          height="100"
          viewBox="0 0 100 100"
          style={{ marginBottom: 24 }}
        >
          <path
            d="M 15 65 Q 30 30, 50 45 Q 60 50, 70 35 Q 78 22, 88 18"
            stroke="#E8E8E8"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 15 65 Q 28 55, 45 58 Q 55 60, 68 52"
            stroke="#E8E8E8"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>

        {/* Lark wordmark */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#E8E8E8',
            letterSpacing: '-3px',
            display: 'flex',
          }}
        >
          Lark
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#707070',
            marginTop: 16,
            display: 'flex',
          }}
        >
          Nights start here.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Space Grotesk',
          data: spaceGrotesk,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );
}
