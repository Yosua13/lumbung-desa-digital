#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

// 1. Struktur Data untuk Pinjaman
#[contracttype]
#[derive(Clone, Debug)]
pub struct Pinjaman {
    id: u64,
    peminjam: Address,
    jumlah: i128,
    keperluan: String,
    sudah_disetujui: bool,
    sudah_lunas: bool,
}

// 2. Storage Keys
const ADMIN: Symbol = symbol_short!("ADMIN");
const DAFTAR_PINJAMAN: Symbol = symbol_short!("LOANS");
const SALDO_LUMBUNG: Symbol = symbol_short!("VAULT");

#[contract]
pub struct LumbungDesaContract;

#[contractimpl]
impl LumbungDesaContract {
    
    // Inisialisasi: Menentukan siapa Kader Digital (Admin)
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Kontrak sudah diinisialisasi");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&SALDO_LUMBUNG, &0i128);
    }

    // Fungsi Warga menabung ke Lumbung
    pub fn menabung(env: Env, warga: Address, jumlah: i128) {
        warga.require_auth(); // Memastikan warga yang menabung adalah pemilik wallet
        
        let mut saldo_sekarang: i128 = env.storage().instance().get(&SALDO_LUMBUNG).unwrap_or(0);
        saldo_sekarang += jumlah;
        
        env.storage().instance().set(&SALDO_LUMBUNG, &saldo_sekarang);
    }

    // Fungsi Warga mengajukan pinjaman (Tanpa Bunga)
    pub fn ajukan_pinjaman(env: Env, warga: Address, jumlah: i128, keperluan: String) -> u64 {
        warga.require_auth();
        
        let mut daftar: Vec<Pinjaman> = env.storage().instance().get(&DAFTAR_PINJAMAN).unwrap_or(Vec::new(&env));
        
        let id_baru = env.prng().gen::<u64>();
        let pinjaman_baru = Pinjaman {
            id: id_baru,
            peminjam: warga,
            jumlah,
            keperluan,
            sudah_disetujui: false,
            sudah_lunas: false,
        };
        
        daftar.push_back(pinjaman_baru);
        env.storage().instance().set(&DAFTAR_PINJAMAN, &daftar);
        
        id_baru
    }

    // Fungsi Kader Digital menyetujui pinjaman
    pub fn setujui_pinjaman(env: Env, kader: Address, id_pinjaman: u64) {
        kader.require_auth();
        
        // Cek apakah yang memanggil benar-back Admin/Kader
        let admin: Address = env.storage().instance().get(&ADMIN).expect("Admin belum diatur");
        if kader != admin {
            panic!("Hanya Kader Digital yang bisa menyetujui");
        }

        let mut daftar: Vec<Pinjaman> = env.storage().instance().get(&DAFTAR_PINJAMAN).unwrap();
        let mut saldo: i128 = env.storage().instance().get(&SALDO_LUMBUNG).unwrap_or(0);

        for i in 0..daftar.len() {
            let mut p = daftar.get(i).unwrap();
            if p.id == id_pinjaman && !p.sudah_disetujui {
                if saldo < p.jumlah {
                    panic!("Saldo lumbung tidak cukup");
                }
                
                p.sudah_disetujui = true;
                saldo -= p.jumlah; // Dana keluar dari lumbung ke warga
                
                daftar.set(i, p);
                env.storage().instance().set(&DAFTAR_PINJAMAN, &daftar);
                env.storage().instance().set(&SALDO_LUMBUNG, &saldo);
                return;
            }
        }
    }

    // Fungsi Warga membayar kembali pinjaman
    pub fn bayar_pinjaman(env: Env, warga: Address, id_pinjaman: u64) {
        warga.require_auth();
        
        let mut daftar: Vec<Pinjaman> = env.storage().instance().get(&DAFTAR_PINJAMAN).unwrap();
        let mut saldo: i128 = env.storage().instance().get(&SALDO_LUMBUNG).unwrap_or(0);

        for i in 0..daftar.len() {
            let mut p = daftar.get(i).unwrap();
            if p.id == id_pinjaman && p.peminjam == warga && !p.sudah_lunas {
                p.sudah_lunas = true;
                saldo += p.jumlah; // Dana kembali ke lumbung tanpa bunga
                
                daftar.set(i, p);
                env.storage().instance().set(&DAFTAR_PINJAMAN, &daftar);
                env.storage().instance().set(&SALDO_LUMBUNG, &saldo);
                return;
            }
        }
    }

    // Fungsi Cek Saldo Lumbung
    pub fn cek_kas_lumbung(env: Env) -> i128 {
        env.storage().instance().get(&SALDO_LUMBUNG).unwrap_or(0)
    }
}