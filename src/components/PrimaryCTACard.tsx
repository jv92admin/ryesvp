interface PrimaryCTACardProps {
  tmUrl?: string | null;
}

export function PrimaryCTACard({ tmUrl }: PrimaryCTACardProps) {
  // Only show if we have TM
  if (!tmUrl) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col gap-3">
        {/* Ticketmaster button - prominent, centered, full-width */}
        {tmUrl && (
          <>
            <a
              href={tmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base text-white font-medium rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#01579B' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              Buy on Ticketmaster
            </a>
            {/* Disclaimer for TM - smaller, less prominent */}
            <p className="text-xs text-gray-400 text-center -mt-1">
              Listings shown as found on marketplaces. Check the event venue for official ticket sales.
            </p>
          </>
        )}

      </div>
    </div>
  );
}

