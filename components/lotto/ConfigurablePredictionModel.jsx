// components/lotto/ConfigurablePredictionModel.jsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';
import _ from 'lodash';

const NextDrawPredictions = ({ predictions }) => {
  if (!predictions) return null;

  const copyAllPredictions = () => {
    const allPredictions = predictions.map((combination, idx) => 
      `הצעה ${idx + 1}: ${combination.join(', ')}`
    ).join('\n');
    
    navigator.clipboard.writeText(allPredictions)
      .then(() => alert('כל ההצעות הועתקו ללוח'))
      .catch(() => alert('שגיאה בהעתקה'));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-right">הצעות להגרלה הבאה</CardTitle>
        <button 
          onClick={copyAllPredictions}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          העתק את כל ההצעות
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-right">
          {predictions.map((combination, idx) => (
            <div key={idx} className="p-2 bg-gray-100 rounded flex justify-between items-center">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(combination.join(', '))
                    .then(() => alert('המספרים הועתקו ללוח'))
                    .catch(() => alert('שגיאה בהעתקה'));
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                העתק
              </button>
              <span>הצעה {idx + 1}: {combination.join(', ')}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ConfigurableModelResults = ({ analysis }) => {
  if (!analysis) return null;
  
  const [viewMode, setViewMode] = useState('recent');
  
  const sortedPredictions = _.orderBy(analysis.predictions, 
    pred => pred.bestPrediction.matchingNumbers.length, 
    'desc'
  );
  
  const displayedPredictions = viewMode === 'recent' 
    ? analysis.predictions.slice(0, 10) 
    : sortedPredictions.slice(0, 10);
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-right">סטטיסטיקת ניבוי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-right">
            <p>ממוצע מספרים תואמים: {analysis.stats.averageMatches.toFixed(2)} מתוך 6</p>
            <h3 className="font-bold mt-4">התפלגות הצלחות ניבוי:</h3>
            {Object.entries(analysis.stats.distribution)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([matches, count]) => (
              <p key={matches}>
                {matches} מספרים תואמים: {count} פעמים
                ({((count / analysis.predictions.length) * 100).toFixed(1)}%)
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('recent')}
              className={`px-4 py-2 rounded ${
                viewMode === 'recent' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              10 הגרלות אחרונות
            </button>
            <button 
              onClick={() => setViewMode('best')}
              className={`px-4 py-2 rounded ${
                viewMode === 'best' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              10 תוצאות טובות ביותר
            </button>
          </div>
          <CardTitle className="text-right">
            {viewMode === 'recent' ? '10 הגרלות אחרונות' : 'התוצאות הטובות ביותר'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-right">
            {displayedPredictions.map((pred, idx) => (
              <div key={idx} className="p-2 bg-gray-100 rounded">
                <p className="font-bold">
                  הגרלה {pred.drawNumber} - {pred.date} 
                  ({pred.bestPrediction.matchingNumbers.length} התאמות)
                </p>
                <p>תוצאה בפועל: {pred.actual.join(', ')}</p>
                <p>הניבוי הטוב ביותר: {pred.bestPrediction.predicted.join(', ')}</p>
                <p>מספרים שנוחשו נכון: {pred.bestPrediction.matchingNumbers.join(', ')}</p>
                <p>דיוק: {pred.bestPrediction.accuracy.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// המשך הקובץ components/lotto/ConfigurablePredictionModel.jsx

const initialConfig = {
    drawsToAnalyze: 100,           
    historicalDepth: 150,          
    combinations: 16,              
    hotNumberWeight: 1.5,          
    coldNumberWeight: 1.4,         
    maxSequentialNumbers: 3,       
    recentNumberWeight: 1.3,       
    maxNumbersPerRow: 3,           
    statisticalCorrectionRate: 0.3,
    range1_7: 2,     
    range8_17: 1,    
    range18_27: 2,   
    range28_37: 1,   
  };
  
  const ConfigurablePredictionModel = () => {
    const [config, setConfig] = useState(initialConfig);
    const [analysis, setAnalysis] = useState(null);
    const [nextDrawPredictions, setNextDrawPredictions] = useState(null);
    const [showPredictions, setShowPredictions] = useState(false);
  
    const isValidCombination = (numbers, recentNumbers, config) => {
      const ranges = [
        numbers.filter(n => n >= 1 && n <= 7).length,
        numbers.filter(n => n >= 8 && n <= 17).length,
        numbers.filter(n => n >= 18 && n <= 27).length,
        numbers.filter(n => n >= 28 && n <= 37).length
      ];
      if (ranges.some(r => r > config.maxNumbersPerRow)) return false;
  
      const sorted = [...numbers].sort((a,b) => a-b);
      for (let i = 0; i < sorted.length - (config.maxSequentialNumbers - 1); i++) {
        if (sorted[i + config.maxSequentialNumbers - 1] === sorted[i] + config.maxSequentialNumbers - 1) return false;
      }
  
      const hasRecentNumber = numbers.some(num => recentNumbers.has(num));
      if (!hasRecentNumber) return false;
  
      return true;
    };
  
    const generatePrediction = (historicalData, config) => {
      const numberFrequency = {};
      for (let i = 1; i <= 37; i++) numberFrequency[i] = 0;
      
      historicalData.slice(0, config.historicalDepth).forEach(draw => {
        draw.numbers.forEach(num => numberFrequency[num]++);
      });
  
      const sortedNumbers = Object.entries(numberFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => parseInt(num));
  
      const hotNumbers = new Set(sortedNumbers.slice(0, 8));
      const coldNumbers = new Set(sortedNumbers.slice(-8));
      const recentNumbers = new Set(historicalData.slice(0, 2).flatMap(draw => draw.numbers));
  
      const combinations = [];
      const maxAttempts = 1000;
      let attempts = 0;
  
      while (combinations.length < config.combinations && attempts < maxAttempts) {
        attempts++;
        const weights = Array(37).fill(1).map((_, i) => {
          let weight = 1;
          if (hotNumbers.has(i + 1)) {
            weight *= Math.random() < 0.5 ? config.hotNumberWeight : 0.8;
          }
          if (coldNumbers.has(i + 1)) {
            weight *= Math.random() < config.statisticalCorrectionRate ? config.coldNumberWeight : 0.9;
          }
          if (recentNumbers.has(i + 1)) {
            weight *= config.recentNumberWeight;
          }
          return weight;
        });
  
        const numbers = new Set();
        while (numbers.size < 6) {
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          let random = Math.random() * totalWeight;
          let selectedIndex = 0;
          
          for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
              selectedIndex = i;
              break;
            }
          }
          numbers.add(selectedIndex + 1);
        }
  
        const combination = Array.from(numbers).sort((a,b) => a-b);
        if (isValidCombination(combination, recentNumbers, config)) {
          combinations.push(combination);
        }
      }
  
      return combinations;
    };
  
    const generateNextDrawPredictions = async () => {
      try {
        const response = await fetch('/Lotto last 400.txt');
        const text = await response.text();
        const draws = Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          dynamicTyping: true
        }).data.slice(1).map(row => ({
          drawNumber: row[0],
          date: row[1],
          numbers: row.slice(2, 8).map(n => String(n).padStart(2, '0')).map(Number).sort((a,b) => a-b)
        })).filter(draw => draw.numbers.every(n => n > 0 && n <= 37));
  
        const predictions = generatePrediction(draws, config);
        setNextDrawPredictions(predictions);
  
      } catch (error) {
        console.error('Error generating predictions:', error);
      }
    };
  
    const analyze = async () => {
      try {
        const response = await fetch('/Lotto last 400.txt');
        const text = await response.text();
        const draws = Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          dynamicTyping: true
        }).data.slice(1).map(row => ({
          drawNumber: row[0],
          date: row[1],
          numbers: row.slice(2, 8).map(n => String(n).padStart(2, '0')).map(Number).sort((a,b) => a-b)
        })).filter(draw => draw.numbers.every(n => n > 0 && n <= 37));
  
        const predictions = draws.slice(0, config.drawsToAnalyze).map((draw, index) => {
          const historicalData = draws.slice(index + 1);
          const predictedCombinations = generatePrediction(historicalData, config);
          
          const actualNumbers = new Set(draw.numbers);
          const hits = predictedCombinations.map(combination => {
            const matchingNumbers = combination.filter(num => actualNumbers.has(num));
            return {
              predicted: combination,
              matches: matchingNumbers.length,
              matchingNumbers,
              accuracy: (matchingNumbers.length / 6) * 100
            };
          });
  
          return {
            drawNumber: draw.drawNumber,
            date: draw.date,
            actual: draw.numbers,
            predictions: hits,
            bestPrediction: _.maxBy(hits, 'matches')
          };
        });
  
        const accuracyStats = predictions.reduce((acc, pred) => ({
          totalMatches: acc.totalMatches + pred.bestPrediction.matches,
          predictions: [...acc.predictions, pred.bestPrediction.matches]
        }), { totalMatches: 0, predictions: [] });
  
        setAnalysis({
          predictions,
          stats: {
            averageMatches: accuracyStats.totalMatches / predictions.length,
            distribution: _.countBy(accuracyStats.predictions)
          }
        });
  
      } catch (error) {
        console.error('Error analyzing data:', error);
      }
    };
  
    return (
        <div className="space-y-6 p-4" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">הגדרות מודל</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-right">
                  {Object.entries(config)
                    .filter(([key]) => !key.startsWith('range'))
                    .map(([key, value]) => (
                    <div key={key}>
                      <label className="block mb-1">{key}</label>
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        step={typeof value === 'number' && value < 1 ? '0.1' : '1'}
                        value={value}
                        onChange={e => setConfig({
                          ...config,
                          [key]: typeof value === 'number' ? parseFloat(e.target.value) : e.target.value
                        })}
                        className="w-full p-2 border rounded text-right"
                      />
                    </div>
                  ))}
                </div>
    
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-4 text-right">הגדרות טווחי מספרים (0-4 מספרים בכל טווח)</h3>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block mb-1">כמות מספרים בטווח 1-7</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={config.range1_7}
                        onChange={e => setConfig({
                          ...config,
                          range1_7: parseInt(e.target.value)
                        })}
                        className="w-full p-2 border rounded text-right"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">כמות מספרים בטווח 8-17</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={config.range8_17}
                        onChange={e => setConfig({
                          ...config,
                          range8_17: parseInt(e.target.value)
                        })}
                        className="w-full p-2 border rounded text-right"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">כמות מספרים בטווח 18-27</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={config.range18_27}
                        onChange={e => setConfig({
                          ...config,
                          range18_27: parseInt(e.target.value)
                        })}
                        className="w-full p-2 border rounded text-right"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">כמות מספרים בטווח 28-37</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={config.range28_37}
                        onChange={e => setConfig({
                          ...config,
                          range28_37: parseInt(e.target.value)
                        })}
                        className="w-full p-2 border rounded text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
    
              <div className="flex gap-4 mt-6">
                <button
                  onClick={analyze}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  הרץ ניתוח
                </button>
                <button
                  onClick={generateNextDrawPredictions}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  צור הצעות להגרלה הבאה
                </button>
              </div>
            </CardContent>
          </Card>
    
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={() => setShowPredictions(false)}
              className={`px-6 py-2 rounded ${
                !showPredictions 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              הצג ניתוח היסטורי
            </button>
            <button 
              onClick={() => setShowPredictions(true)}
              className={`px-6 py-2 rounded ${
                showPredictions 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              הצג הצעות להגרלה הבאה
            </button>
          </div>
    
          {!showPredictions && <ConfigurableModelResults analysis={analysis} />}
          {showPredictions && nextDrawPredictions && <NextDrawPredictions predictions={nextDrawPredictions} />}
        </div>
      );
    };
    
    export default ConfigurablePredictionModel;