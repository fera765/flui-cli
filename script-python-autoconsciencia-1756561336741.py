```python
#!/usr/bin/env python3
"""
Sistema Completo de Análise de Dados
Autor: Flui Autoconsciência
Data: 2024
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import warnings
import os

warnings.filterwarnings('ignore')

class DataAnalyzer:
    """Classe principal para análise de dados avançada"""
    
    def __init__(self, data_path=None):
        """Inicializa o analisador de dados"""
        self.data = None
        self.data_path = data_path
        self.results = {}
        self.cleaned_data = None
        self.outliers = None
        self.correlations = None
    
    def load_data(self, path=None, **kwargs):
        """Carrega dados de arquivo CSV, Excel ou JSON"""
        try:
            path = path or self.data_path
            if path.endswith('.csv'):
                self.data = pd.read_csv(path, **kwargs)
            elif path.endswith('.xlsx'):
                self.data = pd.read_excel(path, **kwargs)
            elif path.endswith('.json'):
                self.data = pd.read_json(path, **kwargs)
            else:
                raise ValueError('Formato de arquivo não suportado.')
            print(f"✅ Dados carregados: {self.data.shape}")
            return self.data
        except Exception as e:
            print(f"❌ Erro ao carregar dados: {e}")
            return None
    
    def describe_data(self):
        """Análise descritiva completa dos dados"""
        if self.data is None:
            print("❌ Nenhum dado carregado")
            return
        
        print("\n📊 ANÁLISE DESCRITIVA")
        print("=" * 50)
        print(f"Dimensões: {self.data.shape}")
        print(f"Colunas: {list(self.data.columns)}")
        print(f"\nTipos de dados:\n{self.data.dtypes}")
        print(f"\nValores nulos:\n{self.data.isnull().sum()}")
        print(f"\nEstatísticas:\n{self.data.describe(include='all')}")
        return self.data.describe(include='all')

    def detect_outliers(self, method='zscore', threshold=3.0):
        """Detecta outliers usando método Z-score ou IQR"""
        if self.data is None:
            print("❌ Nenhum dado para detectar outliers")
            return
        
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        outliers_dict = {}
        
        if method == 'zscore':
            for col in numeric_cols:
                z_scores = np.abs(stats.zscore(self.data[col].dropna()))
                outliers = self.data[col][z_scores > threshold]
                outliers_dict[col] = outliers
        elif method == 'iqr':
            for col in numeric_cols:
                Q1 = self.data[col].quantile(0.25)
                Q3 = self.data[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers = self.data[col][(self.data[col] < lower_bound) | (self.data[col] > upper_bound)]
                outliers_dict[col] = outliers
        else:
            print("Metodo inválido. Use 'zscore' ou 'iqr'.")
            return

        self.outliers = outliers_dict
        print("\n🚩 Outliers detectados:")
        for col, outliers in outliers_dict.items():
            print(f"{col} ({len(outliers)} outliers)")
        return outliers_dict

    def clean_data(self, strategy='drop'):
        """Limpa dados removendo outliers ou valores nulos"""
        if self.data is None:
            print("❌ Nenhum dado para limpeza")
            return
        
        df = self.data.copy()
        # Tratar valores nulos
        nulls_before = df.isnull().sum()
        df = df.dropna() if strategy == 'drop' else df.fillna(df.median(numeric_only=True))
        nulls_after = df.isnull().sum()

        # Remover outliers detectados
        if self.outliers:
            for col, outliers in self.outliers.items():
                df = df[~df[col].isin(outliers)]
        
        self.cleaned_data = df
        print(f"\n🧹 Limpeza concluída. Valores nulos antes/depois:\n{nulls_before} / {nulls_after}")
        print(f"Dados após limpeza: {df.shape}")
        return df

    def correlation_analysis(self, method='pearson'):
        """Análise de correlação entre variáveis"""
        if self.cleaned_data is None:
            print("❌ Dados limpos não disponíveis para análise de correlação")
            return
        corr = self.cleaned_data.corr(method=method)
        self.correlations = corr
        print(f"\n🔗 Matriz de correlação ({method}):")
        print(corr)
        return corr

    def feature_engineering(self, target_variable=None, apply_pca=False, n_components=2):
        """Criação de novas features e redução de dimensionalidade"""
        if self.cleaned_data is None:
            print("❌ Dados limpos não disponíveis para engenharia de features")
            return
        
        df = self.cleaned_data.copy()
        # Encode variáveis categóricas
        for col in df.select_dtypes(include=['object', 'category']).columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
        # Escalar features
        scaler = StandardScaler()
        features = df.columns.tolist()
        features.remove(target_variable) if target_variable in features else None
        scaled_features = scaler.fit_transform(df[features])
        df_scaled = pd.DataFrame(scaled_features, columns=features)
        if target_variable:
            df_scaled[target_variable] = df[target_variable]
        
        # Aplicar PCA
        if apply_pca:
            pca = PCA(n_components=n_components)
            principal_components = pca.fit_transform(df_scaled)
            pcs_df = pd.DataFrame(data=principal_components, columns=[f'PC{i+1}' for i in range(n_components)])
            self.pca_components = pcs_df
            print(f"\n🚀 PCA aplicado: {n_components} componentes")
            return pcs_df
        else:
            self.engineered_data = df_scaled
            print(f"\n📈 Features escaladas e codificadas")
            return df_scaled

    def visualize_distributions(self):
        """Visualiza distribuição das variáveis numéricas"""
        if self.cleaned_data is None:
            print("❌ Dados limpos não disponíveis para visualização")
            return
        numeric_cols = self.cleaned_data.select_dtypes(include=[np.number]).columns
        num_plots = len(numeric_cols)
        plt.figure(figsize=(15, 5 * ((num_plots // 3) + 1)))
        for i, col in enumerate(numeric_cols, 1):
            plt.subplot((num_plots // 3) + 1, 3, i)
            sns.histplot(self.cleaned_data[col], kde=True)
            plt.title(f'Distribuição de {col}')
        plt.tight_layout()
        plt.show()

    def create_report(self, output_path='relatorio_analise.md'):
        """Gera um relatório markdown com resultados da análise"""
        if self.data is None:
            print("❌ Nenhum dado carregado para gerar relatório")
            return
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# Relatório de Análise de Dados\n")
            f.write(f"**Data de geração:** {pd.Timestamp.now()}\n\n")
            f.write("## Dimensão dos Dados\n")
            f.write(f"{self.data.shape}\n\n")
            f.write("## Tipos de Dados\n")
            f.write(str(self.data.dtypes) + "\n\n")
            f.write("## Estatísticas Descritivas\n")
            f.write(self.data.describe().to_markdown() + "\n\n")
            if self.outliers:
                f.write("## Outliers Detectados\n")
                for col, outliers in self.outliers.items():
                    f.write(f"### {col}\n")
                    f.write(outliers.to_string() + "\n\n")
            if self.correlations is not None:
                f.write("## Matriz de Correlação\n")
                f.write(self.correlations.to_markdown() + "\n\n")
        print(f"📄 Relatório gerado em {output_path}")

    def export_results(self, directory='resultados'):
        """Exporta dados limpos, outliers, componentes PCA etc."""
        os.makedirs(directory, exist_ok=True)
        if self.cleaned_data is not None:
            self.cleaned_data.to_csv(os.path.join(directory, 'dados_limpos.csv'), index=False)
        if hasattr(self, 'pca_components'):
            self.pca_components.to_csv(os.path.join(directory, 'pca_componentes.csv'), index=False)
        if self.outliers:
            for col, outliers in self.outliers.items():
                outliers.to_csv(os.path.join(directory, f'outliers_{col}.csv'), index=False)
        print(f"🔖 Resultados exportados em {directory}")
    
    def apply_machine_learning(self, target_variable, test_size=0.2, model=LinearRegression()):
        """Aplica algoritmo de ML para previsão ou classificação"""
        if self.cleaned_data is None:
            print("❌ Dados limpos não disponíveis para ML")
            return

        df = self.cleaned_data.copy()
        # Encode variáveis categóricas
        for col in df.select_dtypes(include=['object', 'category']).columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
        X = df.drop(target_variable, axis=1)
        y = df[target_variable]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        print(f"\n📊 Model {model.__class__.__name__} treinado")
        print(f"Erro Quadrático Médio: {mse}")
        print(f"Coeficiente de Determinação R2: {r2}")
        return {
            'model': model,
            'X_test': X_test,
            'y_test': y_test,
            'y_pred': y_pred,
            'mse': mse,
            'r2': r2
        }

def main():
    # Exemplo de uso completo
    analyzer = DataAnalyzer('dados_exemplo.csv')
    analyzer.load_data()
    analyzer.describe_data()
    analyzer.detect_outliers(method='iqr')
    analyzer.clean_data(strategy='drop')
    analyzer.correlation_analysis()
    analyzer.visualize_distributions()
    analyzer.feature_engineering(target_variable='target', apply_pca=True)
    analyzer.create_report()
    analyzer.export_results()
    ml_results = analyzer.apply_machine_learning(target_variable='target')
    # Mais passos ou análises podem ser adicionados aqui

if __name__ == '__main__':
    main()
```