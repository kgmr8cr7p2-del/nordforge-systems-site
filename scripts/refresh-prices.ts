import { refreshAllPortfolioPrices } from "../src/lib/steam";

refreshAllPortfolioPrices()
  .then((updatedCount) => {
    console.log(`Updated prices for ${updatedCount} unique items.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
