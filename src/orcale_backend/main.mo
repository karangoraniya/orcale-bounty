import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Array "mo:base/Array";
import {recurringTimer } = "mo:base/Timer";

// Import the custom types we have in Types.mo
import Types "Types";

// Actor definition
actor ICPExchangeRate {

    stable var data:[Text]= [];  

    // Method to transform the API response, adding HTTP headers for security
    public query func transform(raw: Types.TransformArgs): async Types.CanisterHttpResponsePayload {
        let transformed: Types.CanisterHttpResponsePayload = {
            status = raw.response.status;
            body = raw.response.body;
            headers = [
                { name = "Content-Security-Policy"; value = "default-src 'self'" },
                { name = "Referrer-Policy"; value = "strict-origin" },
                { name = "Permissions-Policy"; value = "geolocation=(self)" },
                { name = "Strict-Transport-Security"; value = "max-age=63072000" },
                { name = "X-Frame-Options"; value = "DENY" },
                { name = "X-Content-Type-Options"; value = "nosniff" },
            ];
        };
        transformed;
    };

    
    // Main function to get the ICP-USD exchange rate from Coinbase
    public func get_icp_usd_exchange(): async Text {
        // 1. IC Management Canister setup for HTTP request
        let ic: Types.IC = actor ("aaaaa-aa");

        // 2. Set up arguments for the HTTP GET request
        let ONE_MINUTE: Nat64 = 60;
        let start_timestamp: Types.Timestamp = 1682978460;  // Example timestamp
        let host: Text = "api.exchange.coinbase.com";
        let url = "https://" # host # "/products/ICP-USD/candles?start=" # Nat64.toText(start_timestamp) # "&end=" # Nat64.toText(start_timestamp) # "&granularity=" # Nat64.toText(ONE_MINUTE);

        // 2.1 Prepare headers for the HTTP request
        let request_headers = [
            { name = "Host"; value = host # ":443" },
            { name = "User-Agent"; value = "exchange_rate_canister" },
        ];

        // 2.2 Transform context to handle response security
        let transform_context: Types.TransformContext = {
            function = transform;
            context = Blob.fromArray([]);
        };

        // 2.3 Define the HTTP request arguments
        let http_request: Types.HttpRequestArgs = {
            url = url;
            max_response_bytes = null;  // Optional for request
            headers = request_headers;
            body = null;  // Optional for request
            method = #get;
            transform = ?transform_context;
        };

        // 3. Add cycles to pay for the HTTP request
        Cycles.add<system>(230_949_972_000);

        // 4. Make the HTTP request and wait for the response
        let http_response: Types.HttpResponsePayload = await ic.http_request(http_request);

        // 5. Decode the response body from [Nat8] to readable Text
        let response_body: Blob = Blob.fromArray(http_response.body);
        let decoded_text: Text = switch (Text.decodeUtf8(response_body)) {
            case (null) { "No value returned" };
            case (?y) { y };
        };

        // 6. Return the decoded text, which is the response body
        data:= Array.append(data, [decoded_text]);
        decoded_text
    };

    public query func getArray() : async[Text]{
        return data;
    };

    private func privateget():async(){
        let _whatever = await get_icp_usd_exchange();
    };

    ignore recurringTimer<system>(#seconds 1200, privateget);

  
};
