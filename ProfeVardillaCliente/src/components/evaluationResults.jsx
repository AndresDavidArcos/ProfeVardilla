import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaDownload } from 'react-icons/fa';
import { getEvaluationResults } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { usePDF } from 'react-to-pdf';
import { PdfEvaluationResultTemplate } from './PdfEvaluationResultTemplate';
import { indicators } from '../constants/indicators';

export default function EvaluationResults() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [openAccordions, setOpenAccordions] = useState({});
  const { toPDF, targetRef } = usePDF({
    filename: 'Resultados evaluacion ProfeVardilla.pdf',
  });
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const flattenedIndicators = Object.values(indicators).reduce((acc, category) => {
    return { ...acc, ...category.items };
  }, {});
  
  useEffect(() => {
    const loadResults = async () => {
      if (user) {
        try {
          const response = await getEvaluationResults(user.$id);
          console.log("response en evaluationresults: ", response)
          const parsedData = response.documents.map(doc => {
          const results = JSON.parse(doc.results || '{}');
          
          const resultsWithStats = Object.entries(results).reduce((acc, [indicatorId, questions]) => {
            const correct = questions.filter(q => q.passStatus).length;
            const total = questions.length;
            
            acc[indicatorId] = {
              questions,
              stats: {
                correct,
                total,
                percentage: Math.round((correct / total) * 100)
              }
            };
            
            return acc;
          }, {});

          return {
            id: doc.$id,
            title: doc.name,
            date: new Date(doc.$updatedAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            results: resultsWithStats
          };
        });
        setEvaluations(parsedData);
        //deja abierto el primer acordeon, los demas estaran cerrados por default
        const initialOpenState = parsedData.reduce((acc, curr, index) => ({
          ...acc,
          [curr.id]: index === 0
        }), {});
        
        setOpenAccordions(initialOpenState);
      } catch (error) {
        console.error("Error cargando evaluaciones:", error);
      } finally {
        setLoading(false);
        }
      }
    };

    loadResults();
  }, [user]);

  useEffect(() => {
    if (selectedEvaluation) {
        toPDF();
        setSelectedEvaluation(null);
    }
  }, [selectedEvaluation]);

  const toggleAccordion = (id) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Cargando evaluaciones...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Mis Evaluaciones</h2>
        {selectedEvaluation && (
          <div style={{ position: 'absolute', left: '-9999px' }}>
            <PdfEvaluationResultTemplate
              evaluation={selectedEvaluation.results}
              ref={targetRef}
            />
          </div>
        )}
        <div className="space-y-8">
          {evaluations.map((evaluation, index) => (
            <div 
              key={evaluation.id} 
              className={`relative pl-8 ${index === evaluations.length - 1 ? '' : 'pb-8'}`}
            >
              {/* Línea de tiempo continua */}
              <div className="absolute left-0 top-0 h-[calc(100%+2rem)] w-0.5 bg-gray-200"></div>              
              {/* Punto de la línea de tiempo */}
              <div className="absolute left-0 top-6 w-4 h-4 -ml-2 rounded-full bg-primary-500"></div>
              
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                <button
                  onClick={() => toggleAccordion(evaluation.id)}
                  className="flex-grow text-left"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{evaluation.title}</h3>
                    <p className="text-sm text-gray-500">{evaluation.date}</p>
                  </div>                  
                </button>      
                <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedEvaluation(evaluation)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                    >
                      <FaDownload className="w-4 h-4" />
                      <span className="text-sm">Descargar</span>
                    </button>
                    <FaChevronDown 
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openAccordions[evaluation.id] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>                              
                </div>              
                {openAccordions[evaluation.id] && (
                  <div className="px-6 pb-6 space-y-4">
                    {Object.entries(evaluation.results || {}).map(([indicatorId, { questions, stats }]) => {   
                    const resultsArray = questions.map(q => q.passStatus);

                      return (
                        <div key={indicatorId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-600">{stats.percentage}%</span>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">{indicatorId}</span>
                              <span className="text-sm text-gray-500">{stats.correct}/{stats.total}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                             {flattenedIndicators[indicatorId] || 'Indicador'}
                            </p>                            
                            <div className="flex gap-1 mt-2">
                              {resultsArray.map((result, idx) => (
                                <span
                                  key={idx}
                                  className={`h-1 flex-1 rounded-full ${
                                    result ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}