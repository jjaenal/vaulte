const { createPublicClient, http } = require("viem");
const { polygonMumbai } = require("viem/chains");
const path = require("path");
const fs = require("fs");
const eventBus = require("./eventBus");

// Muat ABI DataVault dari folder abis
// Path ABI yang benar (folder abis berada di root vaulte-backend)
const dataVaultAbiPath = path.join(
  __dirname,
  "..",
  "..",
  "abis",
  "DataVault.json"
);
let DATA_VAULT_ABI = [];
try {
  const raw = fs.readFileSync(dataVaultAbiPath, "utf8");
  const json = JSON.parse(raw);
  DATA_VAULT_ABI = json.abi || json; // beberapa file menyimpan abi di field 'abi'
} catch (err) {
  console.warn("Warning: gagal memuat DataVault ABI:", err.message);
}

function createClient() {
  const rpcUrl = process.env.RPC_URL || "https://rpc-mumbai.maticvigil.com/";
  return createPublicClient({
    chain: polygonMumbai,
    transport: http(rpcUrl),
    batch: { multicall: true },
  });
}

let unwatch = null;

function startWatcher() {
  const contractAddress = process.env.DATA_VAULT_ADDRESS;
  if (!contractAddress) {
    console.info("DataVault watcher disabled: DATA_VAULT_ADDRESS not set");
    return;
  }
  if (!DATA_VAULT_ABI || DATA_VAULT_ABI.length === 0) {
    console.info("DataVault watcher disabled: ABI not loaded");
    return;
  }

  const client = createClient();

  try {
    unwatch = client.watchContractEvent({
      address: contractAddress,
      abi: DATA_VAULT_ABI,
      // subscribe semua event terkait kategori
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { eventName, args } = log;
          // Coba ekstrak alamat pemilik dan categoryId dari args, fallback ke publish umum
          const owner =
            (args && (args.owner || args.user || args.account)) || null;
          const categoryId = (args && (args.categoryId || args.id)) || null;

          const payload = {
            type: "on_chain_update",
            eventName,
            ownerAddress: owner ? String(owner).toLowerCase() : undefined,
            categoryId:
              categoryId !== null && categoryId !== undefined
                ? Number(categoryId)
                : undefined,
            timestamp: Date.now(),
          };

          if (owner) {
            eventBus.publish(owner, payload);
          } else {
            // Jika tidak ada owner, broadcast umum bisa di-handle client sesuai kebutuhan
            // Untuk kesederhanaan, abaikan broadcast umum
          }
        });
      },
      // Fallback polling
      pollingInterval: 10_000,
    });
    console.info("DataVault watcher started");
  } catch (err) {
    console.error("Failed to start DataVault watcher:", err);
  }
}

function stopWatcher() {
  if (typeof unwatch === "function") {
    try {
      unwatch();
    } catch (e) {
      // Informasi ringan saat cleanup watcher gagal; tidak kritikal
      console.info("Watcher cleanup failed:", e?.message);
    }
    unwatch = null;
  }
}

module.exports = { startWatcher, stopWatcher };
