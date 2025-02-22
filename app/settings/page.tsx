"use client";
import { useState, useEffect } from "react";
import { getUserByEmail, updateUserByEmail } from "@/utils/db/actions"; 
import toast from "react-hot-toast";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string; 
  updatedAt: string; 
}

export default function Settings() {
  const [updatedUser, setUpdatedUser] = useState<User | null>(null); 
  const [initialUser, setInitialUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); 
  const [avatarChanged, setAvatarChanged] = useState<boolean>(false); 
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); 

  useEffect(() => {
    const fetchUser = async () => {
      const email = localStorage.getItem("userEmail"); 
      if (email) {
        try {
          const user = await getUserByEmail(email); 
          if (user) {
            const userWithDateStrings = {
              ...user,
              createdAt: new Date(user.createdAt).toISOString(), 
              updatedAt: new Date(user.updatedAt).toISOString(), 
            };
            setUpdatedUser(userWithDateStrings);
            setInitialUser(userWithDateStrings); 
            setAvatarPreview(user.avatar); 
          }
        } catch (error) {
          console.error("Kullanıcı bilgileri alınırken hata oluştu:", error);
        }
      }
    };

    fetchUser();
  }, []); 

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  const readFileAsBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string); 
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updatedUser) {
      toast.error("Kullanıcı bilgileri geçersiz.");
      return;
    }

    const isUserUpdated =
      updatedUser.name !== initialUser?.name ||
      updatedUser.phone !== initialUser?.phone ||
      updatedUser.avatar !== initialUser?.avatar;

    if (!isUserUpdated) {
      toast.error("Hiçbir değişiklik yapılmadı.");
      return;
    }

    if (lastUpdated && new Date().getTime() - lastUpdated.getTime() < 300000) {
      toast.error("Son güncellemeden sonra herhangi bir değişiklik yapılmadı.");
      return;
    }

    setLoading(true);
    try {
      const updatedData = await updateUserByEmail(updatedUser.email, {
        name: updatedUser.name,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      });

      if (updatedData) {
        setUpdatedUser({
          ...updatedUser!,
          name: updatedData.name,
          phone: updatedData.phone,
          avatar: updatedData.avatar,
          updatedAt: new Date().toISOString(),
          createdAt: updatedData.createdAt.toISOString(),
        });
        setLastUpdated(new Date());
        toast.success("Kullanıcı bilgileri başarıyla güncellendi.");
      } else {
        toast.error("Kullanıcı bilgileri güncellenemedi.");
      }
    } catch (error) {
      console.error("Güncelleme sırasında bir hata oluştu:", error);
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (updatedUser) {
      setUpdatedUser((prevUser) => ({
        ...prevUser!,
        [name]: value === "" ? null : value,
      }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Data = await readFileAsBase64(file);
        setAvatarPreview(base64Data);
        setAvatarChanged(true);

        if (updatedUser) {
          setUpdatedUser((prevUser) => ({
            ...prevUser!,
            avatar: base64Data,
          }));
        }
      } catch (error) {
        console.error("Avatar dosyası okunurken hata oluştu:", error);
      }
    }
  };

  if (updatedUser === null) {
    return <div></div>;
  }

  const isUserUpdated =
    updatedUser.name !== initialUser?.name ||
    updatedUser.phone !== initialUser?.phone ||
    updatedUser.avatar !== initialUser?.avatar;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <h2 className="text-3xl text-center font-semibold mb-8 text-gray-800">
        Hesap Ayarları
      </h2>
      <div className="border-gray-50 rounded-xl shadow-lg overflow-hidden mb-4 p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="flex justify-center mb-6 relative">
              <div className="w-48 h-48 rounded-full overflow-hidden relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-lg">
                    Resim Yok
                  </div>
                )}
                
              
                <div className="absolute inset-0 flex justify-center items-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-3xl text-white bg-black rounded-full p-2 cursor-pointer">
                    
                  </span>
                </div>

                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Ad Soyad
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={updatedUser.name || ""}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={updatedUser.email}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                readOnly
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Telefon
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={updatedUser.phone || ""}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Telefon numarası"
              />
            </div>
            <div>
              <label
                htmlFor="createdAt"
                className="block text-sm font-medium text-gray-700"
              >
                Kayıt Tarihi
              </label>
              <input
                id="createdAt"
                name="createdAt"
                type="text"
                value={formatDate(updatedUser.createdAt)} 
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                readOnly 
                required
              />
            </div>

            <div>
              <label
                htmlFor="updatedAt"
                className="block text-sm font-medium text-gray-700"
              >
                Son Güncellenme
              </label>
              <input
                id="updatedAt"
                name="updatedAt"
                type="text"
                value={formatDate(updatedUser.updatedAt)} 
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                readOnly 
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition"
              disabled={loading || !isUserUpdated}
            >
              {loading ? "Güncelleniyor..." : "Güncelle"} 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
