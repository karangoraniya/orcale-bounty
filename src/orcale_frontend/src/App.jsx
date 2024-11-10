import { useState, useEffect } from "react";
import { orcale_backend } from "declarations/orcale_backend";

function App() {
  const [currentRate, setCurrentRate] = useState("");
  const [historicalRates, setHistoricalRates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch current exchange rate
  const fetchExchangeRate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rate = await orcale_backend.get_icp_usd_exchange();
      setCurrentRate(rate);
    } catch (err) {
      setError("Failed to fetch current exchange rate");
      console.error("Error fetching exchange rate:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch historical data
  const fetchHistoricalData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await orcale_backend.getArray();
      setHistoricalRates(data);
    } catch (err) {
      setError("Failed to fetch historical data");
      console.error("Error fetching historical data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch historical data on component mount
  useEffect(() => {
    fetchHistoricalData();
  }, []);

  // Parse and format the exchange rate data
  const formatExchangeRate = (rateData) => {
    try {
      const parsed = JSON.parse(rateData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Assuming the Coinbase API returns [timestamp, open, high, low, close, volume]
        return `$${parsed[4].toFixed(2)}`; // Using close price
      }
      return "Invalid data format";
    } catch {
      return rateData; // Return raw data if parsing fails
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <img src="/logo2.svg" alt="DFINITY logo" className="h-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">ICP-USD Exchange Rate</h1>
      </header>

      <div className="space-y-6">
        {/* Current Rate Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Exchange Rate</h2>
          <div className="flex space-x-4">
            <button
              onClick={fetchExchangeRate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Get Current Rate"}
            </button>
            <div className="text-2xl font-mono">
              {currentRate && formatExchangeRate(currentRate)}
            </div>
          </div>
        </div>

        {/* Historical Data Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Historical Rates</h2>
            <button
              onClick={fetchHistoricalData}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              disabled={isLoading}
            >
              Refresh Data
            </button>
          </div>

          <div className="overflow-auto max-h-96">
            {historicalRates.length > 0 ? (
              <ul className="space-y-2">
                {historicalRates.map((rate, index) => (
                  <li key={index} className="p-2 bg-gray-50 rounded">
                    {formatExchangeRate(rate)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No historical data available</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
