import React, { useState, useEffect } from 'react';
import { Camera, Check, X, Flame, Calendar, Upload, Sparkles } from 'lucide-react';

const UpForestFinder = () => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [dailyItems, setDailyItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);

  const upForestItems = [
    { id: 1, name: "White Pine Cone", category: "Trees", difficulty: "easy" },
    { id: 2, name: "Birch Bark", category: "Trees", difficulty: "easy" },
    { id: 3, name: "Red Maple Leaf", category: "Trees", difficulty: "easy" },
    { id: 4, name: "Moss-Covered Rock", category: "Nature", difficulty: "easy" },
    { id: 5, name: "Mushroom (any variety)", category: "Fungi", difficulty: "medium" },
    { id: 6, name: "Fern Frond", category: "Plants", difficulty: "easy" },
    { id: 7, name: "Deer Track", category: "Wildlife", difficulty: "medium" },
    { id: 8, name: "Hemlock Branch", category: "Trees", difficulty: "medium" },
    { id: 9, name: "Acorn", category: "Trees", difficulty: "easy" },
    { id: 10, name: "Wild Blueberry Bush", category: "Plants", difficulty: "medium" },
    { id: 11, name: "Cedar Branch", category: "Trees", difficulty: "easy" },
    { id: 12, name: "Lichen on Tree", category: "Nature", difficulty: "medium" },
    { id: 13, name: "Pine Needles (cluster)", category: "Trees", difficulty: "easy" },
    { id: 14, name: "Stream or Creek", category: "Water", difficulty: "medium" },
    { id: 15, name: "Bird Nest", category: "Wildlife", difficulty: "hard" },
    { id: 16, name: "Wild Flower", category: "Plants", difficulty: "medium" },
    { id: 17, name: "Spider Web", category: "Wildlife", difficulty: "medium" },
    { id: 18, name: "Fallen Log", category: "Nature", difficulty: "easy" },
  ];

  useEffect(() => {
    generateDailyItems();
  }, []);

  const generateDailyItems = () => {
    const shuffled = [...upForestItems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    setDailyItems(selected);
    setCompletedItems([]);
    setVerificationResult(null);
    setSelectedItem(null);
    setUploadedImage(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyImage = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: uploadedImage.split(';')[0].split(':')[1],
                    data: uploadedImage.split(',')[1]
                  }
                },
                {
                  type: "text",
                  text: `You are verifying images for a nature scavenger hunt in the Upper Peninsula forests. 
                  
The user is looking for: "${selectedItem.name}"

Analyze this image and determine if it shows the requested item. Consider:
- Does the image clearly show ${selectedItem.name}?
- Is it photographed in a natural outdoor setting?
- Is the item the main subject of the photo?

Respond ONLY with a JSON object (no preamble, no markdown):
{
  "verified": true or false,
  "confidence": number between 0-100,
  "feedback": "brief encouraging message explaining your decision"
}`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === "text")?.text || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(cleaned);

      setVerificationResult(result);

      if (result.verified && result.confidence > 70) {
        setCompletedItems([...completedItems, selectedItem.id]);
        
        // Check if all items are completed
        if (completedItems.length + 1 === dailyItems.length) {
          updateStreak();
        }
      }
    } catch (error) {
      setVerificationResult({
        verified: false,
        confidence: 0,
        feedback: "Sorry, there was an error verifying your image. Please try again!"
      });
    }

    setIsVerifying(false);
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastCompletedDate === yesterday || !lastCompletedDate) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > longestStreak) {
        setLongestStreak(newStreak);
      }
    } else if (lastCompletedDate !== today) {
      setCurrentStreak(1);
    }

    setLastCompletedDate(today);
  };

  const closeVerification = () => {
    setSelectedItem(null);
    setUploadedImage(null);
    setVerificationResult(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center gap-2">
            <Sparkles className="text-green-600" />
            UP Forest Finder
          </h1>
          <p className="text-gray-600">Discover the beauty of the Upper Peninsula, one adventure at a time</p>
          
          {/* Streak Display */}
          <div className="flex gap-4 mt-4 justify-center">
            <div className="bg-orange-50 rounded-xl p-4 flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="text-orange-500" size={24} />
                <span className="text-3xl font-bold text-orange-600">{currentStreak}</span>
              </div>
              <span className="text-sm text-gray-600">Day Streak</span>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="text-blue-500" size={24} />
                <span className="text-3xl font-bold text-blue-600">{longestStreak}</span>
              </div>
              <span className="text-sm text-gray-600">Best Streak</span>
            </div>
          </div>
        </div>

        {/* Daily Challenges */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Today's Finds</h2>
            <span className="text-sm text-gray-500">
              {completedItems.length}/{dailyItems.length} Complete
            </span>
          </div>

          <div className="space-y-3">
            {dailyItems.map((item) => {
              const isCompleted = completedItems.includes(item.id);
              
              return (
                <div
                  key={item.id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    isCompleted
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 cursor-pointer'
                  }`}
                  onClick={() => !isCompleted && setSelectedItem(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty}
                        </span>
                      </div>
                    </div>
                    <div>
                      {isCompleted ? (
                        <div className="bg-green-500 rounded-full p-2">
                          <Check className="text-white" size={24} />
                        </div>
                      ) : (
                        <div className="bg-gray-200 rounded-full p-2">
                          <Camera className="text-gray-600" size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {completedItems.length === dailyItems.length && (
            <div className="mt-6 bg-green-500 text-white rounded-xl p-4 text-center">
              <h3 className="font-bold text-xl mb-2">🎉 All Items Found!</h3>
              <p>Great job exploring the UP forests today!</p>
              <button
                onClick={generateDailyItems}
                className="mt-3 bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Get New Challenges
              </button>
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Find: {selectedItem.name}</h3>
                <button onClick={closeVerification} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {!uploadedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-600 mb-4">Upload a photo of {selectedItem.name}</p>
                  <label className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-green-700 transition-colors inline-block">
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <img src={uploadedImage} alt="Upload preview" className="w-full rounded-lg mb-4" />
                  
                  {!verificationResult && (
                    <button
                      onClick={verifyImage}
                      disabled={isVerifying}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Photo'}
                    </button>
                  )}

                  {verificationResult && (
                    <div className={`p-4 rounded-lg ${verificationResult.verified ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {verificationResult.verified ? (
                          <Check className="text-green-600" size={24} />
                        ) : (
                          <X className="text-red-600" size={24} />
                        )}
                        <span className="font-bold text-lg">
                          {verificationResult.verified ? 'Verified!' : 'Not Verified'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">{verificationResult.feedback}</p>
                      
                      {verificationResult.verified ? (
                        <button
                          onClick={closeVerification}
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                        >
                          Done
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setUploadedImage(null);
                              setVerificationResult(null);
                            }}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                          >
                            Try Again
                          </button>
                          <button
                            onClick={closeVerification}
                            className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpForestFinder;