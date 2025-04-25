"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { deleteUser, getUserByEmail } from "@/utils/db/actions";
import { TriangleAlert } from "lucide-react"; 

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

export default function HesapSilme() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrorMessage("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const user = await getUserByEmail(email);

    if (!user) {
      setErrorMessage("Kullanıcı bulunamadı.");
      setLoading(false);
      return;
    }

    try {
      const isDeleted = await deleteUser(email);

      if (isDeleted) {
        setMessage("Hesabınız başarıyla silindi.");
        if (web3auth.connected) {
          await web3auth.logout();
        }

        localStorage.removeItem("userEmail");
        localStorage.removeItem("userBalance");

        setTimeout(() => {
          router.push("/");
        }, 500);
      } else {
        setErrorMessage("Hesap silme işlemi sırasında bir hata oluştu.");
      }
      setLoading(false);
    } catch (error) {
      console.error("Hata:", error);
      setErrorMessage("Hesap silme işlemi sırasında bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto bg-white shadow-lg rounded-lg mt-20">
      <div className="flex items-center mb-6">
        <TriangleAlert size={36} color="#d9534f" className="mr-2" /> 
        <span className="text-slate-950 font-bold text-3xl text-center ">
          Hesap Silme Uyarısı
        </span>
      </div>
  
      <div className="mb-10">
        <p className="mb-6 mt-12 font-semibold">
          Hesabınızı silmeye karar verdiğinizde, aşağıdaki bilgilerinizi içeren
          tüm veriler kalıcı olarak silinecektir:
        </p>
        <ul className="list-disc ml-5 my-4 mt-8 mb-8">
            <li>
              <b>E-posta Adresiniz:</b> Hesabınızla ilişkilendirilmiş e-posta
              adresiniz kaybolur ve geri alınamaz.
            </li>
            <li>
              <b>Ödülleriniz:</b> Kazandığınız tüm ödüller ve ödül birikimleriniz
              kaybolur.
            </li>
            <li>
              <b>Bakiyeniz:</b> Hesabınızdaki bakiye (puan, TL vb.) tamamen
              silinir.
            </li>
            <li>
              <b>Seviyeniz:</b> Mevcut seviyeniz ve elde ettiğiniz tüm ilerleme
              kaybolur.
            </li>
            <li>
              <b>Liderlik Sıralaması:</b> Liderlik sıralamasındaki yeriniz
              silinir ve geri getirilemez.
            </li>
            <li>
              <b>Toplanan ve Bildirilen Atıklar:</b> Hesabınıza kaydedilen tüm
              atık verileri silinecektir.
            </li>
            <li>
              <b>Kupon Kodlarınız:</b> Kullanılamayan kupon kodlarınız geçersiz
              hale gelir.
            </li>
        </ul>
        <p>
          Bu işlem geri alınamaz, yani verileriniz bir daha kurtarılamaz. Lütfen
          hesabınızı silmeden önce, hesabınızda tanımlı olan kupon kodu, ödül
          veya puanlarınızı kullanın.
        </p>
        <p className="font-semibold text-lg mt-4 text-red-700">
          <b>Unutmayın:</b> Hesabınızı sildikten sonra tüm verileriniz kalıcı
          olarak kaybolacaktır. Bu işlem geri alınamaz.
        </p>
      </div>
  
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-lg font-semibold text-slate-800"
          >
            Hesabınızı silmek için e-posta adresinizi doğrulayın:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="w-full p-3 mt-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
  
        {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
  
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 mt-4 bg-red-600 text-white rounded-md disabled:bg-gray-400"
        >
          {loading ? "Siliniyor..." : "Evet, hesabımı sil"}
        </button>
      </form>
    </div>
  );
  
  
  
}
