import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import OutCall "http-outcalls/outcall";
import Order "mo:core/Order";

actor {
  module CacheKey {
    public func compare(key1 : CacheKey, key2 : CacheKey) : Order.Order {
      switch (Text.compare(key1.symbol, key2.symbol)) {
        case (#equal) { Text.compare(key1.interval, key2.interval) };
        case (order) { order };
      };
    };
  };

  type CacheKey = {
    symbol : Text;
    interval : Text;
  };

  type CacheEntry = {
    data : Text;
    timestamp : Int;
  };

  type PriceCacheEntry = {
    price : Text;
    timestamp : Int;
  };

  let cache = Map.empty<CacheKey, CacheEntry>();
  let priceCache = Map.empty<Text, PriceCacheEntry>();

  let cacheDuration : Int = 300_000_000_000; // 5 minutes in nanoseconds
  let priceCacheDuration : Int = 15_000_000_000; // 15 seconds in nanoseconds
  let apiKey : Text = "demo";

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getCandles(symbol : Text, interval : Text) : async Text {
    let cacheKey : CacheKey = { symbol; interval };
    let now = Time.now();

    switch (cache.get(cacheKey)) {
      case (?entry) {
        if (now - entry.timestamp < cacheDuration) {
          return entry.data;
        };
      };
      case (null) {};
    };

    let url = "https://api.twelvedata.com/time_series?symbol=" # symbol # "&interval=" # interval # "&apikey=" # apiKey;
    let response = await OutCall.httpGetRequest(url, [], transform);

    let newEntry : CacheEntry = {
      data = response;
      timestamp = now;
    };
    cache.add(cacheKey, newEntry);
    response;
  };

  public shared ({ caller }) func getPrice(symbol : Text) : async Text {
    let now = Time.now();

    switch (priceCache.get(symbol)) {
      case (?entry) {
        if (now - entry.timestamp < priceCacheDuration) {
          return entry.price;
        };
      };
      case (null) {};
    };

    let url = "https://api.twelvedata.com/price?symbol=" # symbol # "&apikey=" # apiKey;
    let response = await OutCall.httpGetRequest(url, [], transform);

    let newEntry : PriceCacheEntry = {
      price = response;
      timestamp = now;
    };
    priceCache.add(symbol, newEntry);
    response;
  };
};
