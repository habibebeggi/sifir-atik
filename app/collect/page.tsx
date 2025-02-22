"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getWasteCollectionTasks, updateTaskStatus, saveReward,  saveCollectedWastes,  getUserByEmail} from "@/utils/db/actions";
import { Trash2, MapPin, CheckCircle,  Clock, Upload, Loader, Calendar, Weight, Search, Gift} from "lucide-react";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

type CollectionTask = {
  id: number;
  location: string;
  wasteType: string;
  amount: string;
  status: "pending" | "in_progress" | "completed" | "verified";
  date: string;
  collectorId: number | null;
};

const ITEMS_PER_PAGE = 10;

export default function CollectPage() {
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);

  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null);
  const [verificationImage, setVerificationImage] = useState<string | null>(
    null
  );
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");
  const [verificationResult, setVerificationResult] = useState<{
    wasteTypeMatch: boolean;
    quantityMatch: boolean;
    confidence: number;
  } | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const [isVerified, setIsVerified] = useState(false); 

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      setLoading(true);
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            toast.error("Kullanıcı bulunamadı!");
          }
        } else {
          toast.error("Kullanıcı bulunamadı! Giriş yapın.");
        }

        const fetchedTasks = await getWasteCollectionTasks();
        setTasks(fetchedTasks as CollectionTask[]);
      } catch (error) {
        console.error(
          "Kullanıcı ve görev bilgileri getirilemedi! Hata: ",
          error
        );
        toast.error(
          "Kullanıcı ve görev bilgileri yüklenemedi! tekrar deneyiniz."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleStatusChange = async (
    taskId: number,
    newStatus: CollectionTask["status"]
  ) => {
    if (!user) {
      toast.error("Atık toplayabilmek için lütfen giriş yapın.");
      return;
    }

    try {
      const updateTask = await updateTaskStatus(taskId, newStatus, user.id);
      if (updateTask) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: newStatus, collectorId: user.id }
              : task
          )
        );
        toast.success("Görev durumu başarıyla güncellendi!");
      } else {
        toast.error("Görev durumu güncellenemedi!");
      }
    } catch (error) {
      console.error("Görev durumu güncellenemedi! Hata: ", error);
      toast.error("Görev durumu güncellenemedi!");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const readFileAsBase64 = (dataUrl: string): string => {
    return dataUrl.split(",")[1];
  };

  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user || isVerified) {
      toast.error(
        "Doğrulama için gereken bilgiler eksik veya işlem zaten tamamlanmış!"
      );
      return;
    }

    setVerificationStatus("verifying");

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = readFileAsBase64(verificationImage);
      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
      ];

      const prompt = `
        Sen bir geri dönüşüm ve atık uzmanısın. Gönderilen görseli analiz et ve sonuçları sadece şu formatta JSON olarak döndür:
        {
          "wasteType": "atık türü (ör. plastik, kağıt, cam)",
          "quantity": "kg cinsinden tahmini miktar",
          "confidence": 0 ile 1 arasında bir sayı
        }
        Başka hiçbir metin ekleme, sadece bu JSON formatında yanıt döndür.
      `;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const responseText = await response.text();
      const cleanedResponse = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsedResult = JSON.parse(cleanedResponse);

      const wasteType = parsedResult.wasteType.toLowerCase().trim();
      let quantity = parseFloat(parsedResult.quantity);
      const confidence = parseFloat(parsedResult.confidence);

      if (!wasteType || isNaN(quantity) || isNaN(confidence)) {
        throw new Error("Yanıt hatalı veya eksik.");
      }

      const quantityString = `${quantity} kg`; 
      quantity = parseFloat(quantityString); 
      const isComplexWaste = wasteType.split(",").length > 1;
      const normalizedWasteType = isComplexWaste ? "karmaşık" : wasteType;
      const wasteTypeMatch = normalizedWasteType.includes(
        selectedTask.wasteType.toLowerCase()
      );
      const quantityMatch =
        Math.abs(quantity - parseFloat(selectedTask.amount)) <= 5;

      setVerificationResult({
        wasteTypeMatch,
        quantityMatch,
        confidence,
      });

      setVerificationStatus("success");

      if (wasteTypeMatch && quantityMatch && confidence > 0.7) {
        await handleStatusChange(selectedTask.id, "verified");
        const earnedReward = Math.floor(Math.random() * 50) + 10;

        await saveReward(user.id, earnedReward);
        await saveCollectedWastes(selectedTask.id, user.id, parsedResult);
        setReward(earnedReward);
        setIsVerified(true); 
        toast.success(`Doğrulama başarılı! ${earnedReward} puan kazandınız!`, {
          duration: 5000,
          position: "top-center",
        });
      } else {
        toast.error(
          "Doğrulama başarısız! Toplanan atık ve bildirilen atık eşleşmiyor. ",
          {
            duration: 5000,
            position: "top-center",
          }
        );
      }
    } catch (error) {
      console.error("Atık doğrulanamadı! Hata: ", error);
      setVerificationStatus("failure");
      toast.error("Doğrulama işlemi başarısız! Tekrar deneyiniz.");
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold  text-gray-800">
        Atık Toplama Görevleri
      </h1>

      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="Toplamak istediğiniz atık konumunu arayın"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2 border focus:border-green-500 hover:border-green-500 bg-white"
        />
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"></div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                    {task.location}
                  </h2>
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center relative">
                    <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                    <span
                      onMouseEnter={() => setHoveredWasteType(task.wasteType)}
                      onMouseLeave={() => setHoveredWasteType(null)}
                      className="cursor-pointer"
                    >
                      {task.wasteType.length > 8
                        ? `${task.wasteType.slice(0, 8)}...`
                        : task.wasteType}
                    </span>
                    {hoveredWasteType === task.wasteType && (
                      <div className="absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {task.wasteType}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-gray-500" />
                    {task.amount}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {formatDate(task.date)}
                  </div>
                </div>
                <div className="flex justify-end">
                  {task.status === "pending" && (
                    <Button
                      onClick={() => handleStatusChange(task.id, "in_progress")}
                      variant="outline"
                      size="sm"
                      style={{
                        display: "inline-block",
                        visibility: "visible",
                        opacity: 1,
                        zIndex: 10, 
                      }}
                    >
                      Toplamaya Başla
                    </Button>
                  )}

                  {task.status === "in_progress" &&
                    task.collectorId === user?.id && (
                      <Button
                        onClick={() => setSelectedTask(task)}
                        className="bg-white text-black hover:bg-purple-600 hover:text-white px-4 py-6"
                        variant="outline"
                        size="sm"
                      >
                        Tamamla & Doğrula
                      </Button>
                    )}
                  {task.status === "in_progress" &&
                    task.collectorId !== user?.id && (
                      <span className="text-yellow-600 text-sm font-medium">
                        Başka bir toplayıcı tarafından toplanıyor
                      </span>
                    )}
                  {task.status === "verified" && (
                    <span className="text-green-600 text-sm font-medium flex items-center">
                      <Gift className="h-4 w-4 mr-1" />
                      Ödül Verildi
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center mt-4 space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="hover:bg-blue-100 hover:text-blue-700"
            >
              Önceki
            </Button>

            <div className="font-semibold text-gray-700">
              Sayfa {currentPage} / {pageCount > 0 ? pageCount : 1}
            </div>

            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage(Math.min(pageCount, currentPage + 1))
              }
              className="hover:bg-blue-100 hover:text-blue-700"
            >
              Sonraki
            </Button>
          </div>
        </>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Toplama İşlemini Doğrula
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Toplanan atıkları doğrulamak ve ödülünüzü kazanmak için bir
              fotoğraf yükleyin.
            </p>
            <div className="mb-4">
              <label
                htmlFor="verification-image"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Fotoğraf Yükle
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-400 hover:border-green-600 rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="verification-image"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Bir dosya yükle</span>
                      <input
                        id="verification-image"
                        name="verification-image"
                        type="file"
                        className="sr-only"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {" "}
                    10 MB' a kadar PNG, JPG, GIF{" "}
                  </p>
                </div>
              </div>
            </div>
            {verificationImage && (
              <img
                src={verificationImage}
                alt="Verification"
                className="mb-4 rounded-md w-full"
              />
            )}
            <Button
              onClick={handleVerify}
              className="w-full bg-green-600 text-white hover:bg-green-700"
              disabled={
                !verificationImage || verificationStatus === "verifying"
              }
            >
              {verificationStatus === "verifying" ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Doğrulanıyor...
                </>
              ) : (
                "Atığı Doğrula"
              )}
            </Button>
            {verificationStatus === "success" && verificationResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p>
                  Atık Türü Eşleşiyor Mu? :{" "}
                  {verificationResult.wasteTypeMatch ? "Evet" : "Hayır"}
                </p>
                <p>
                  Atık Miktarı Eşleşiyor Mu? :{" "}
                  {verificationResult.quantityMatch ? "Evet" : "Hayır"}
                </p>
                <p>
                  Tahmini Doğruluk Oranı:{" "}
                  {(verificationResult.confidence * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {verificationStatus === "failure" && (
              <p className="mt-2 text-red-600 text-center font-bold text-sm">
                Doğrulama işlemi başarısız! Tekrar deneyiniz.
              </p>
            )}
            <Button
              onClick={() => setSelectedTask(null)}
              variant="outline"
              className="w-full mt-2"
            >
              Kapat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CollectionTask["status"] }) {
  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800",
      label: "Beklemede",
      icon: Clock,
    },
    in_progress: {
      color: "bg-blue-100 text-blue-800",
      label: "Devam Ediyor",
      icon: Trash2,
    },
    completed: {
      color: "bg-green-100 text-green-800",
      label: "Tamamlandı",
      icon: CheckCircle,
    },
    verified: {
      color: "bg-purple-100 text-purple-800",
      label: "Doğrulandı",
      icon: CheckCircle,
    },
  };

  const {
    color,
    icon: Icon,
    label,
  } = statusConfig[status] || {
    color: "bg-gray-100 text-gray-800",
    icon: Clock,
    label: "Bilinmeyen", 
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex items-center`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </span>
  );
}
