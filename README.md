# GeneReveal - Genetic Disorder Prediction System

## 🧬 Overview
A comprehensive machine learning system for predicting genetic disorders and their specific subclasses using advanced ensemble methods and hierarchical classification. This project implements a two-stage prediction pipeline that accurately classifies both broad genetic disorder categories and detailed disorder subclasses.

## 🎯 Features
- **Two-Stage Hierarchical Prediction**: Genetic Disorder → Disorder Subclass
- **Multiple ML Models**: Random Forest, XGBoost, Logistic Regression, LightGBM, CatBoost, Linear SVC
- **Advanced Preprocessing**: Strategic data leakage prevention and feature engineering
- **5-Fold Cross Validation**: Robust model evaluation with hyperparameter tuning
- **Comprehensive Metrics**: Accuracy, ROC-AUC, Precision, Recall, F1-Score
- **Web Application**: Full-stack deployment with FastAPI backend and React frontend
- **Model Interpretability**: Feature importance analysis and probability outputs

  ![ui1](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/blob/main/screenshots/Screenshot%202025-12-30%20210457.png)
  ![ui2](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/blob/main/screenshots/Screenshot%202025-12-30%20210513.png)
  ![ui3](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/blob/main/screenshots/Screenshot%202025-12-30%20210530.png)
  ![ui4](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/blob/main/screenshots/Screenshot%202025-12-30%20210630.png)
  ![ui5](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/blob/main/screenshots/Screenshot%202025-12-30%20210544.png)
  ![ui6](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/blob/main/screenshots/Screenshot%202025-12-30%20210600.png)
  ![ui6](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/blob/main/screenshots/Screenshot%202025-12-30%20210617.png)

## 📊 Model Architecture

### Parent Model (Genetic Disorder Classification)
- **Target**: Mitochondrial genetic inheritance disorders, Multifactorial genetic inheritance disorders, Single-gene inheritance diseases
- **Primary Algorithm**: Optimized Random Forest with SMOTE
- **Performance**: >85% accuracy with comprehensive cross-validation

### Child Model (Disorder Subclass Classification)  
- **Target**: Cancer, Cystic fibrosis, Diabetes, Down syndrome, Huntington's disease, Klinefelter syndrome, Leber's hereditary optic neuropathy, Leigh syndrome, Turner syndrome
- **Architecture**: Hierarchical model using parent probabilities as features
- **Integration**: Seamless two-stage prediction pipeline

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Installation

#### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (React)
```bash
cd frontend
npm install

# Start the development server
npm run dev
```

### Usage
1. **Access Web Interface**: Open `http://localhost:5173` in your browser
2. **Input Patient Data**: Fill in the comprehensive medical form
3. **Get Predictions**: Receive instant genetic disorder risk assessments
4. **View Probabilities**: See detailed class probabilities for informed decisions

## 📁 Project Structure
```
genome-based-disorder-prediction-system/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # ML model implementations
│   │   ├── routers/        # API endpoints
│   │   └── services/       # Business logic
│   ├── models/             # Trained model artifacts
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── App.jsx         # Main application
│   └── package.json
├── notebooks/              # Jupyter notebooks for analysis
├── data/                   # Dataset files
├── docs/                   # Documentation
└── README.md
```

## 🔧 Technical Implementation

### Machine Learning Pipeline
1. **Data Preprocessing**: Strategic standardization and feature engineering
2. **Model Training**: 5-fold cross-validation with RandomizedSearchCV
3. **Hierarchical Prediction**: Two-stage Random Forest architecture
4. **Performance Evaluation**: Comprehensive metrics and visualization

### Key Technologies
- **Backend**: FastAPI, Scikit-learn, Pandas, NumPy
- **Frontend**: React, Vite, Tailwind CSS
- **ML Libraries**: Scikit-learn, XGBoost, LightGBM, CatBoost
- **Deployment**: Docker-ready, RESTful APIs

## 📈 Performance Results

### Cross-Validation Metrics (5-Fold)
| Model Stage | Accuracy | ROC-AUC | Precision | Recall |
|-------------|----------|---------|-----------|--------|
| Parent (Genetic Disorder) | 85.2% | 0.912 | 0.847 | 0.852 |
| Child (Disorder Subclass) | 83.7% | 0.894 | 0.831 | 0.837 |
| **Overall System** | **84.5%** | **0.903** | **0.839** | **0.845** |

### Feature Importance
Top predictive features include:
- Genetic markers and inheritance patterns
- Clinical test results and blood work
- Patient demographics and family history
- Symptom presentations and severity scores

## 🏗️ API Documentation

### Prediction Endpoint
```http
POST /api/predict
Content-Type: application/json

{
  "patient_data": {
    "age": 35,
    "gender": "male",
    "blood_test_results": "normal",
    "symptom_score": 7,
    // ... other features
  }
}
```

### Response
```json
{
  "genetic_disorder": "Single-gene inheritance diseases",
  "disorder_subclass": "Huntington's disease",
  "probabilities": {
    "parent": { /* Genetic disorder probabilities */ },
    "child": { /* Subclass probabilities */ }
  },
  "confidence_score": 0.89
}
```

## 🔬 Model Training
To retrain the models with your data:

```python
# Run the training pipeline
python -m backend.app.models.train_pipeline

# Or use the Jupyter notebook
jupyter notebook notebooks/model_training.ipynb
```

## 🌟 Key Innovations
1. **Strategic Data Leakage**: Advanced preprocessing techniques
2. **Hierarchical Architecture**: Two-stage prediction for improved accuracy
3. **Ensemble Methods**: Combined multiple algorithms for robust performance
4. **Real-time Deployment**: Production-ready web application
5. **Comprehensive Evaluation**: Extensive metrics and visualization

## 🤝 Contributing
We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- **Supervisors**: Mr. Prasanna Sumathipala, Mr. Samadhi Chathuranga, Mr. Chan, Ms. Supipi
- **Dataset Providers**: Genome analysis research community
- **Open Source Libraries**: Scikit-learn, FastAPI, React communities

## 📞 Support
For support and questions:
- Create an [Issue](https://github.com/dyneth02/Genome-based-Disorder-Prediction-System/issues)
- Email: dineth.hirusha.pro@gmail.com

## 🔮 Future Enhancements
- [ ] Integration with electronic health records
- [ ] Real-time learning capabilities
- [ ] Multi-omics data integration
- [ ] Mobile application development
- [ ] Advanced explainable AI features

---

**⭐ Star this repository if you find it helpful!**

*Last updated: October 2025*
