import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from  "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, transfer } from  "@solana/spl-token";
import fs from 'fs';

(async () => {
  // Connect to cluster
  const connection = new Connection('http://localhost:8899', 'confirmed');

   
  const privateKeyPath = 'target/deploy/minterAccount-keypair.json'; // Modifier le chemin selon ton environnement
  // Charger la clé privée depuis le fichier JSON
  const idJson = JSON.parse(fs.readFileSync(privateKeyPath, 'utf-8'));
  const privateKeyBytes = Uint8Array.from(idJson);

  // Convertir le tableau d'octets en Buffer
  const privateKeyBuffer = Buffer.from(privateKeyBytes);

  // Créer une instance Keypair à partir de la clé privée
  const fromWallet = Keypair.fromSecretKey(privateKeyBuffer);

  // Create a new token 
  const mint = await createMint(
    connection, 
    fromWallet,            // Payer of the transaction
    fromWallet.publicKey,  // Account that will control the minting 
    null,                  // Account that will control the freezing of the token 
    0                      // Location of the decimal place 
  );

  // Get the token account of the fromWallet Solana address. If it does not exist, create it.
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );

  // Generate a new wallet to receive the newly minted token
  const toWallet = Keypair.generate();

  // Get the token account of the toWallet Solana address. If it does not exist, create it.
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    toWallet.publicKey
  );

  // Minting 1 new token to the "fromTokenAccount" account we just returned/created.
  let signature = await mintTo(
    connection,
    fromWallet,               // Payer of the transaction fees 
    mint,                     // Mint for the account 
    fromTokenAccount.address, // Address of the account to mint to 
    fromWallet.publicKey,     // Minting authority
    1                         // Amount to mint 
  );

  await setAuthority(
    connection,
    fromWallet,            // Payer of the transaction fees
    mint,                  // Account 
    fromWallet.publicKey,  // Current authority 
    0,                     // Authority type: "0" represents Mint Tokens 
    null                   // Setting the new Authority to null
  );

  signature = await transfer(
    connection,
    fromWallet,               // Payer of the transaction fees 
    fromTokenAccount.address, // Source account 
    toTokenAccount.address,   // Destination account 
    fromWallet.publicKey,     // Owner of the source account 
    1                         // Number of tokens to transfer 
  );

  console.log("SIGNATURE", signature);
  console.log('Adresse du compte de jeton associé :', fromTokenAccount.address.toString());

    // Sauvegarder l'adresse du compte de jeton associé dans un fichier
    fs.writeFileSync('target/deploy/account.txt', fromTokenAccount.address.toString());

})();