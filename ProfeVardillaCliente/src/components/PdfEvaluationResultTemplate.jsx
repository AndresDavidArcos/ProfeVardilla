import React from "react"
export const PdfEvaluationResultTemplate = React.forwardRef(({ evaluation }, ref) => (
  <div ref={ref} className="max-w-[21cm] mx-auto bg-white p-8 font-sans">
    <header className="text-center mb-8 border-b pb-6">
      <h1 className="text-3xl font-bold mb-2">Reporte de Evaluación</h1>
      <p className="text-gray-600">Fecha: {new Date().toLocaleDateString()}</p>
    </header>

    {Object.entries(evaluation).map(([indicatorId, { questions, stats }]) => (
      <section key={indicatorId} className="mb-8">
  <div className="flex flex-wrap items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg">
    <h2 className="text-xl font-medium text-gray-800">
      <span className="text-gray-500 font-normal">Indicador:</span> {indicatorId}
    </h2>
    
    <div className="flex items-center gap-3">
      <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
        <span className="font-bold text-gray-800 text-lg">{stats.correct}</span>
        <span className="text-gray-400 mx-1">/</span>
        <span className="font-medium text-gray-600">{stats.total}</span>
      </div>
      
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        stats.percentage >= 70 ? 'bg-blue-100 text-blue-800' : 
        stats.percentage >= 40 ? 'bg-amber-100 text-amber-800' : 
        'bg-gray-100 text-gray-800'
      }`}>
        {stats.percentage}%
      </div>
    </div>
  </div>

        
        {questions.map((q, idx) => (
          <div key={idx} className="mb-6 border-l-4 border-gray-300 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-sm ${
                q.passStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {q.passStatus ? 'Correcto' : 'Incorrecto'}
              </span>
              <span className="text-sm text-gray-500">Pregunta {idx + 1}</span>
            </div>
            <h3 className="font-semibold mb-2">{q.question}</h3>
            <div className="bg-gray-50 p-4 rounded mb-2">
              <p className="text-sm text-gray-700">{q.answer}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-blue-800">{q.correction}</p>
            </div>
          </div>
        ))}
      </section>
    ))}
  </div>
));