import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- TYPES ---
enum AppState {
  CAMERA,
  EDITING,
  LOADING,
  RESULT,
}

interface EditOption {
  name: string;
  prompt: string;
}

// --- CONSTANTS ---
const EDIT_OPTIONS: EditOption[] = [
  { name: 'Saboroso', prompt: 'Faça esta comida parecer mais saborosa, suculenta e deliciosa, realçando as cores e a textura.' },
	{ name: 'Rústico', prompt: 'adicione um fundo de restaurante rústico.' },
	{ name: 'Cinematográfica', prompt: 'dê uma aparência cinematográfica.' },
  { name: 'Gourmet', prompt: 'Edite esta foto para que pareça um prato de restaurante gourmet, com iluminação sofisticada e um toque artístico.' },
  { name: 'Dramático', prompt: 'Adicione um fundo escuro e dramático a esta imagem de comida, fazendo o prato se destacar.' },
  { name: 'Vibrante', prompt: 'Aumente a vibração e o brilho das cores nesta foto, tornando-a mais viva e apetitosa.' },
  { name: 'Vintage', prompt: 'Dê a esta foto um estilo de comida vintage, com tons quentes, sépia e um toque nostálgico.' },
  { name: 'Sushi', prompt: 'Melhore esta foto de sushi para parecer feita por um fotógrafo gastronômico profissional com câmerad de DSLR. Use foco nítido no sushi principal e fundo levemente desfocado (bokeh suave). Iluminação natural e suave, cores vivas e realistas que despertem apetite. Destaque o brilho do peixe e a textura do arroz com aspecto fresco e úmido. Mantenha estilo japonês autêntico, composição harmônica e aparência 100% real, sem exageros ou efeito artificial. Resultado final: padrão de revista gourmet ou cardápio premium de restaurante japonês. ' },
  { name: 'Pizza', prompt: 'Melhore a foto da pizza completa para parecer feita por um fotógrafo gastronômico profissional com câmera DSLR. Mantenha massa italiana e borda italiana aerada, levemente dourada e crocante, com textura autêntica. Use iluminação natural, foco nítido e sombras suaves para realismo ultra-detalhado. Coloque a pizza sobre uma tábua rústica de madeira escura e realista, destacando cores vivas, queijo derretido.' },
  { name: 'Buffet ', prompt: 'Melhore esta foto de buffet para parecer feita por um fotógrafo gastronômico profissional com câmera DSLR. A imagem deve ter iluminação natural e equilibrada, foco nítido nos pratos e profundidade de campo realista. Realce cores, texturas e brilho dos alimentos, mantendo aparência apetitosamente fresca. Adicione detalhes sutis que destaquem o buffet, como reflexos suaves, sombras delicadas e composição harmoniosa. Resultado final: foto 100% realista, padrão revista gourmet ou cardápio premium de restaurante.' },
  { name: 'Drink', prompt: '> Melhore a foto do drink como se fosse feita por um fotógrafo gastronômico profissional com câmera DSLR. Realce cores vibrantes, transparência do gelo, brilho do líquido e textura dos ingredientes. Use iluminação natural ou sofisticada, foco nítido no drink principal, fundo levemente desfocado (bokeh suave) e sombras delicadas. Mantenha a composição elegante, copo limpo e detalhes ultra-realistas que despertem apetite. Resultado final: imagem 100% realista, digna de revista gourmet ou cardápio premium de coquetelaria.' },
  { name: 'Empresário', prompt: '> Melhore a imagem de , mantendo fidelidade absoluta à fisionomia original, incluindo traços faciais, expressão, textura da pele, cabelo e proporções reais e preservando integralmente o cenário de fundo, sem qualquer modificação ou substituição. A otimização deve elevar a imagem ao padrão de fotografia profissional de estúdio, com tratamento de luz e cor refinado, simulando iluminação direta e indireta balanceada, com difusores e refletores de luz suaves, resultando em um visual natural, nítido e sofisticado. Capture a estética de uma foto feita com câmera profissional full frame, com profundidade de campo realista, foco preciso, cores equilibradas e contraste natural, sem descaracterizar o cenário original. A pessoa deve estar vestida em estilo sport fino contemporâneo, adaptado ao gênero e biotipo: Homem: blazer de corte moderno, camisa de gola moderna, calça de tecido sofisticado ajustada e sapatos de couro ou mocassim de design contemporâneo. Mulher: blazer acinturado ou casaco elegante, blusa de gola moderna (alta ou baixa), calça de alfaiataria ou saia midi refinada, e sapatos de salto baixo ou mocassim moderno. A cada nova criação, varie o modelo, a textura e a cor das roupas, mantendo sempre o mesmo estilo sport fino e harmonia estética. O resultado final deve transmitir sofisticação, conforto e realismo fotográfico, com texturas nítidas, caimento natural, iluminação de estúdio equilibrada e aparência premium, como se fosse uma foto editorial feita por fotógrafo profissional em ambiente real.' },
  { name: 'Restaurante', prompt: '> Recrie a imagem do ambiente, mantendo fidelidade absoluta às características físicas do local, incluindo layout, móveis, decoração, cores e objetos existentes sem qualquer modificação ou substituição. A imagem deve ser tratada como fotografia profissional de estúdio Capturada com câmera profissional de alta qualidade (full-frame, lente adequada para arquitetura/interiores). Iluminação equilibrada, combinando luz direta e indireta, ressaltando todos os elementos do ambiente. Cores vibrantes e naturais, sem distorção, destacando a paleta original do restaurante. Contraste, nitidez e profundidade de campo aprimorados, dando sensação de realismo e tridimensionalidade. Atmosfera elegante, acolhedora e convidativa, própria de fotos profissionais de interiores. O resultado deve ser uma fotografia impecável, valorizando a estética, o design e a iluminação do restaurante, sem alterar nenhum elemento físico do local, apenas elevando a qualidade visual da imagem para padrão de uso editorial ou marketing profissional. adicione um fundo de restaurante rústico, adicione um fundo de restaurante buffet rústico, adicione um fundo de contraste de foto profissional, add a rustic background , dê uma aparência cinematográfica.' },
];

const LoadingMessages = [
    "Aperfeiçoando os sabores visuais...",
    "Adicionando um toque de chef...",
    "Preparando sua obra-prima culinária...",
    "Quase pronto para servir...",
];


// --- ICONS ---
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-9l2-2 2 2m-2-2v6m-4 4l2 2 2-2m-2 2V10" />
  </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);

const RetryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a9 9 0 0115.46-4.16l-2.93 2.93a5 5 0 00-8.6 3.23V9H3zM21 15a9 9 0 01-15.46 4.16l2.93-2.93a5 5 0 008.6-3.23V15h3z" />
    </svg>
);

// --- GEMINI SERVICE ---
async function editImageWithGemini(base64ImageData: string, prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData.split(',')[1],
        },
    };

    const textPart = {
        text: `Esta é a foto de um prato de comida. ${prompt}`,
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content.parts ?? []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    throw new Error("Não foi possível gerar a imagem. Tente novamente.");
}

// --- HELPER FUNCTIONS ---
const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.CAMERA);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCustomPromptOpen, setCustomPromptOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loadingMessage, setLoadingMessage] = useState(LoadingMessages[0]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      setError("Não foi possível acessar a câmera. Por favor, verifique as permissões no seu navegador.");
    }
  }, []);

  useEffect(() => {
    if (appState === AppState.CAMERA) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [appState, startCamera]);
    
  useEffect(() => {
    let interval: number;
    if (appState === AppState.LOADING) {
        interval = window.setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = LoadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % LoadingMessages.length;
                return LoadingMessages[nextIndex];
            });
        }, 2000);
    }
    return () => clearInterval(interval);
  }, [appState]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        setCapturedImage(dataUrl);
        setAppState(AppState.EDITING);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleEdit = async (prompt: string) => {
    if (!capturedImage) return;
    setAppState(AppState.LOADING);
    setCustomPromptOpen(false);
    setError(null);
    try {
        const result = await editImageWithGemini(capturedImage, prompt);
        setEditedImage(result);
        setAppState(AppState.RESULT);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Ocorreu um erro ao editar a imagem.");
        setAppState(AppState.EDITING);
    }
  };

  const handleShare = async () => {
    if (!editedImage) return;
    try {
        const blob = base64ToBlob(editedImage, 'image/png');
        const file = new File([blob], 'foto-food-5.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { 
            await navigator.share({
                files: [file],
                title: 'Minha Foto Food 5',
                text: 'Olha que foto incrível de comida eu editei com IA!',
            });
        } else {
           const link = document.createElement('a');
           link.href = editedImage;
           link.download = 'foto-food-5.png';
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
        }
    } catch (err) {
        console.error("Erro ao compartilhar:", err);
        setError("Não foi possível compartilhar a imagem.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.CAMERA);
    setCapturedImage(null);
    setEditedImage(null);
    setError(null);
    setCustomPrompt("");
    setCustomPromptOpen(false);
  };
    
  const CustomPromptModal = () => (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-30 p-4">
        <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl border border-gray-700">
            <button onClick={() => setCustomPromptOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
                <CloseIcon className="w-6 h-6"/>
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Descreva sua edição</h3>
            <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: adicione vapor saindo do prato, deixe com cara de verão..."
                className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
            />
            <button
                onClick={() => handleEdit(customPrompt)}
                disabled={!customPrompt.trim()}
                className="w-full mt-4 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <SparklesIcon className="w-5 h-5"/>
                Aplicar Edição
            </button>
        </div>
    </div>
  );

  const renderContent = () => {
    switch (appState) {
      case AppState.CAMERA:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-end">
             {error && <div className="absolute top-4 mx-4 p-3 bg-red-500 text-white rounded-lg z-20">{error}</div>}
             <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover"></video>
             <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-black to-transparent"></div>
             <canvas ref={canvasRef} className="hidden"></canvas>
             <button onClick={handleCapture} className="z-10 mb-8 w-20 h-20 rounded-full border-4 border-white bg-white/30 backdrop-blur-sm focus:outline-none ring-4 ring-transparent active:ring-purple-500 transition-all duration-300"></button>
          </div>
        );

      case AppState.EDITING:
      case AppState.LOADING:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
             <img src={capturedImage || ''} alt="Capturada" className="max-w-full max-h-full object-contain" />
             
             {appState === AppState.EDITING && (
                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-20 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-5">Escolha um estilo</h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {EDIT_OPTIONS.map(opt => (
                                <button key={opt.name} onClick={() => handleEdit(opt.prompt)} className="bg-gray-800 text-white py-4 rounded-lg hover:bg-purple-600 transition-all duration-300 text-sm font-semibold">
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setCustomPromptOpen(true)} className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                             <PencilIcon className="w-5 h-5"/>
                             Personalizar
                        </button>
                    </div>
                     <button onClick={handleReset} className="mt-6 text-white bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors">Tirar outra foto</button>
                 </div>
             )}
            
             {isCustomPromptOpen && <CustomPromptModal />}

             {appState === AppState.LOADING && (
                 <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-30 p-4 text-center">
                    <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin"></div>
                    <p className="text-white text-lg mt-6 font-semibold">{loadingMessage}</p>
                 </div>
             )}
          </div>
        );

      case AppState.RESULT:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <img src={editedImage || ''} alt="Editada" className="max-w-full max-h-[calc(100%-100px)] object-contain rounded-lg shadow-2xl" />
            <div className="absolute bottom-6 flex space-x-4">
                <button onClick={handleShare} className="flex items-center gap-2 bg-purple-600 text-white font-bold py-3 px-6 rounded-full hover:bg-purple-700 transition-all duration-300 shadow-lg">
                    <ShareIcon className="w-5 h-5"/>
                    Compartilhar
                </button>
                <button onClick={handleReset} className="flex items-center gap-2 bg-gray-700 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-600 transition-all duration-300 shadow-lg">
                    <RetryIcon className="w-5 h-5"/>
                    Nova Foto
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="h-[100dvh] w-screen bg-black text-white overflow-hidden">
        <h1 className="absolute top-4 left-4 text-xl font-bold z-20 text-white mix-blend-difference">Foto Food 5</h1>
        {renderContent()}
    </main>
  );
}
