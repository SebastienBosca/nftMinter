import * as fs from 'fs';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { Program, AnchorProvider, setProvider, Wallet } from '@project-serum/anchor';

async function main() {
  try {
    // Charger la paire de clés principale depuis le fichier local
    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync("/home/seb/.config/solana/id.json", 'utf-8'))),
    );

    // Charger la paire de clés pour l'autorité du minterAccount depuis le fichier local
    const minterAccountKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync('target/deploy/minterAccount-keypair.json', 'utf-8'))),
    );

    // Charger l'adresse du TokenAccount depuis le fichier
    const tokenAccountAddressPath = 'target/deploy/account.txt';
    const tokenAccountAddress = fs.readFileSync(tokenAccountAddressPath, 'utf-8').trim();
    const tokenAccountPublicKey = new PublicKey(tokenAccountAddress);

    // Créer une connexion vers le cluster local Solana (par défaut, port 8899)
    const connection = new Connection('http://localhost:8899', 'confirmed');

    // Créer un vrai Wallet pour signer les transactions
    const wallet = {
      signTransaction: async (transaction: Transaction) => {
        transaction.partialSign(keypair);
        return transaction;
      },
      signAllTransactions: async (transactions: Transaction[]) => {
        transactions.forEach(transaction => transaction.partialSign(keypair));
        return transactions;
      },
      publicKey: keypair.publicKey,
    };

    // Afficher les clés publiques pour vérifier
    console.log("Keypair public key:", keypair.publicKey.toBase58());
    console.log("Minter account public key:", minterAccountKeypair.publicKey.toBase58());
    console.log("Token account public key:", tokenAccountPublicKey.toBase58());

    // Charger l'IDL et l'ID du programme
    const idl = JSON.parse(fs.readFileSync('./target/idl/nft_storage.json', 'utf-8'));
    console.log("IDL:", idl);
    const programId = new PublicKey("8vt2EUt8A2zpepJe8AbghFUa6eHgRCoGNreiETsRGcfS");

    // Initialiser AnchorProvider avec la connexion et le Wallet
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: 'confirmed',
    });

    // Définir le fournisseur comme fournisseur par défaut pour le programme
    setProvider(provider);

    // Créer l'interface du programme à partir de l'IDL
    const program = new Program(idl, programId);
    console.log("Programme initialisé");

    // Afficher les comptes avant l'appel RPC
    console.log("Accounts:", {
      nftAccount: tokenAccountPublicKey.toBase58(),
      user: minterAccountKeypair.publicKey.toBase58(),
      systemProgram: SystemProgram.programId.toBase58(),
    });

    // Afficher les signataires avant l'appel RPC
    console.log("Signers:", {
      minterAccount: minterAccountKeypair.publicKey.toBase58(),
    });

    // Appeler une fonction du programme en utilisant la méthode moderne
    const tx = await program.methods.createNft(
      10,  // height
      10,  // width
      5,   // nbchest
      Buffer.alloc(100),  // data
      0,   // positionX
      0,   // positionY
      Buffer.alloc(10),   // finalX
      Buffer.alloc(10)    // finalY
    )
    .accounts({
      nftAccount: tokenAccountPublicKey,
      user: minterAccountKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([minterAccountKeypair])
    .rpc();

    console.log("Transaction confirmée avec le hash:", tx);

  } catch (error) {
    console.error("Erreur:", error);
  }
}

main();
