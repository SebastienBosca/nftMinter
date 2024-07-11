use anchor_lang::prelude::*;

declare_id!("8vt2EUt8A2zpepJe8AbghFUa6eHgRCoGNreiETsRGcfS");

#[program]
mod nft_storage {
    use super::*;

    pub fn create_nft(
        ctx: Context<CreateNft>, 
        height: u8, 
        width: u8, 
        nbchest: u8, 
        data: Vec<u8>, 
        position_x: u8, 
        position_y: u8, 
        final_x: Vec<u8>, 
        final_y: Vec<u8>
    ) -> Result<()> {
        let nft_account = &mut ctx.accounts.nft_account;
        nft_account.owner = *ctx.accounts.user.key;
        nft_account.height = height;
        nft_account.width = width;
        nft_account.nbchest = nbchest;
        nft_account.data = data;
        nft_account.position_x = position_x;
        nft_account.position_y = position_y;
        nft_account.final_x = final_x;
        nft_account.final_y = final_y;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(height: u8, width: u8, nbchest: u8)]
pub struct CreateNft<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 2 + 32 + 4 + 1 + ((height as usize * width as usize + 3) / 4)+ 2 + 4 + (nbchest as usize * 2)
    )]
    pub nft_account: Account<'info, NftAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NftAccount {
    pub owner: Pubkey,
    pub height: u8,
    pub width: u8,
    pub nbchest: u8,
    pub data: Vec<u8>,
    pub position_x: u8,
    pub position_y: u8,
    pub final_x: Vec<u8>,
    pub final_y: Vec<u8>,
}

impl NftAccount {
    pub fn get_element(&self, i: u8, j: u8) -> u8 {
        let index = (i as usize * self.width as usize) + j as usize;
        let byte_index = index / 4;
        let bit_offset = (8 - (index % 4) * 2) % 8;
        (self.data[byte_index] >> bit_offset) & 0b11 // Extraction des 2 derniers bits
    }
}
