-- CreateTable
CREATE TABLE "WeatherCache" (
    "id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "forecastDate" TEXT NOT NULL,
    "tempHigh" INTEGER NOT NULL,
    "tempLow" INTEGER NOT NULL,
    "feelsLikeHigh" INTEGER NOT NULL,
    "feelsLikeLow" INTEGER NOT NULL,
    "precipChance" INTEGER NOT NULL,
    "humidity" INTEGER NOT NULL,
    "uvIndex" INTEGER NOT NULL,
    "windSpeed" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "conditionIcon" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherCache_forecastDate_idx" ON "WeatherCache"("forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherCache_lat_lng_forecastDate_key" ON "WeatherCache"("lat", "lng", "forecastDate");
