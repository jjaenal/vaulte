// Script untuk transfer ETH dari akun Hardhat default ke alamat user
// Jalankan dengan: npx hardhat run scripts/transfer-eth.js --network localhost

const hre = require("hardhat");

async function main() {
  // Alamat tujuan - alamat dari screenshot (dengan checksum yang benar)
  const targetAddress = "0x1a1d5f36ff24bb2d4d5fe7be0063c012b5c48f8b";
  
  // Jumlah ETH yang akan ditransfer (dalam ETH)
  const amountToSend = "100";
  
  console.log(`Mengirim ${amountToSend} ETH ke ${targetAddress}...`);
  
  // Ambil signer pertama (akun default Hardhat dengan banyak ETH)
  const [sender] = await hre.ethers.getSigners();
  
  // Cek saldo sender sebelum transfer
  const senderBalanceBefore = await hre.ethers.provider.getBalance(sender.address);
  console.log(`Saldo sender sebelum transfer: ${hre.ethers.formatEther(senderBalanceBefore)} ETH`);
  
  // Kirim transaksi
  const tx = await sender.sendTransaction({
    to: targetAddress,
    value: hre.ethers.parseEther(amountToSend),
  });
  
  // Tunggu transaksi selesai
  console.log(`Transaksi terkirim: ${tx.hash}`);
  await tx.wait();
  console.log("Transaksi berhasil dikonfirmasi!");
  
  console.log("Transfer selesai! Refresh MetaMask untuk melihat saldo baru.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });