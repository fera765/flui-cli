#!/usr/bin/env python3
"""
Script para testar o Flui CLI com tarefas específicas
e validar a geração de conteúdo
"""

import os
import time
import subprocess
import json
from pathlib import Path

class FluiTester:
    def __init__(self):
        self.workspace = Path("/workspace")
        self.results = []
        
    def send_task_to_flui(self, task_description):
        """Envia tarefa para o Flui via arquivo"""
        task_file = self.workspace / "flui_task.txt"
        task_file.write_text(task_description)
        print(f"\n📝 Tarefa enviada: {task_description[:100]}...")
        time.sleep(2)
        
    def count_words_in_file(self, filepath):
        """Conta palavras em um arquivo"""
        try:
            if not filepath.exists():
                return 0
            content = filepath.read_text(encoding='utf-8', errors='ignore')
            # Remove código e markup
            import re
            # Remove HTML tags
            content = re.sub(r'<[^>]+>', '', content)
            # Remove markdown code blocks
            content = re.sub(r'```[\s\S]*?```', '', content)
            # Remove URLs
            content = re.sub(r'http[s]?://\S+', '', content)
            # Conta palavras reais
            words = content.split()
            return len(words)
        except Exception as e:
            print(f"Erro ao contar palavras: {e}")
            return 0
    
    def find_generated_files(self, pattern="*", min_age_seconds=0):
        """Encontra arquivos gerados recentemente"""
        current_time = time.time()
        generated = []
        
        # Procura em todo o workspace
        for root, dirs, files in os.walk(self.workspace):
            # Ignora node_modules e .git
            if 'node_modules' in root or '.git' in root:
                continue
                
            for file in files:
                filepath = Path(root) / file
                # Verifica se foi criado/modificado recentemente
                if filepath.stat().st_mtime > (current_time - min_age_seconds):
                    if pattern == "*" or pattern in file:
                        generated.append(filepath)
                        
        return generated
    
    def validate_task_1(self):
        """Valida artigo sobre economia - 16000 palavras"""
        print("\n🔍 Validando Tarefa 1: Artigo sobre economia e juros (16000 palavras)")
        
        # Procura arquivos gerados nos últimos 60 segundos
        files = self.find_generated_files(min_age_seconds=60)
        
        article_files = []
        for f in files:
            if any(keyword in f.name.lower() for keyword in ['artigo', 'economia', 'juros', 'article', 'economy']):
                article_files.append(f)
        
        if not article_files:
            # Procura em diretórios específicos
            possible_paths = [
                self.workspace / "artigo-economia.md",
                self.workspace / "artigo-economia.txt",
                self.workspace / "flui-output" / "artigo-economia.md",
                self.workspace / "output" / "artigo-economia.md",
            ]
            
            for path in possible_paths:
                if path.exists():
                    article_files.append(path)
        
        if article_files:
            for article in article_files:
                word_count = self.count_words_in_file(article)
                print(f"  📄 Arquivo: {article.name}")
                print(f"  📊 Palavras contadas: {word_count}")
                
                if word_count >= 15000:  # 93% do solicitado
                    print(f"  ✅ APROVADO: {word_count} palavras")
                    return True, word_count
                else:
                    print(f"  ❌ REPROVADO: Apenas {word_count} palavras (esperado 16000)")
        else:
            print("  ❌ Nenhum arquivo de artigo encontrado")
            
        return False, 0
    
    def validate_task_2(self):
        """Valida ebook sobre TikTok - 20000 palavras"""
        print("\n🔍 Validando Tarefa 2: Ebook sobre monetização no TikTok (20000 palavras)")
        
        files = self.find_generated_files(min_age_seconds=120)
        
        ebook_files = []
        for f in files:
            if any(keyword in f.name.lower() for keyword in ['ebook', 'tiktok', 'monetiza']):
                ebook_files.append(f)
        
        if ebook_files:
            for ebook in ebook_files:
                word_count = self.count_words_in_file(ebook)
                print(f"  📄 Arquivo: {ebook.name}")
                print(f"  📊 Palavras contadas: {word_count}")
                
                if word_count >= 19000:  # 95% do solicitado
                    print(f"  ✅ APROVADO: {word_count} palavras")
                    return True, word_count
                else:
                    print(f"  ❌ REPROVADO: Apenas {word_count} palavras (esperado 20000)")
        else:
            print("  ❌ Nenhum arquivo de ebook encontrado")
            
        return False, 0
    
    def validate_task_3(self):
        """Valida VSL - 7000 palavras"""
        print("\n🔍 Validando Tarefa 3: VSL para plano de saúde (7000 palavras)")
        
        files = self.find_generated_files(min_age_seconds=180)
        
        vsl_files = []
        for f in files:
            if any(keyword in f.name.lower() for keyword in ['vsl', 'video', 'script', 'roteiro']):
                vsl_files.append(f)
        
        if vsl_files:
            for vsl in vsl_files:
                word_count = self.count_words_in_file(vsl)
                print(f"  📄 Arquivo: {vsl.name}")
                print(f"  📊 Palavras contadas: {word_count}")
                
                if word_count >= 6500:  # 93% do solicitado
                    print(f"  ✅ APROVADO: {word_count} palavras")
                    return True, word_count
                else:
                    print(f"  ❌ REPROVADO: Apenas {word_count} palavras (esperado 7000)")
        else:
            print("  ❌ Nenhum arquivo de VSL encontrado")
            
        return False, 0
    
    def validate_task_4(self):
        """Valida documentação React - 30000 palavras"""
        print("\n🔍 Validando Tarefa 4: Documentação React JS (30000 palavras)")
        
        files = self.find_generated_files(min_age_seconds=240)
        
        doc_files = []
        for f in files:
            if any(keyword in f.name.lower() for keyword in ['react', 'doc', 'manual', 'guide']):
                doc_files.append(f)
        
        if doc_files:
            total_words = 0
            for doc in doc_files:
                word_count = self.count_words_in_file(doc)
                print(f"  📄 Arquivo: {doc.name}")
                print(f"  📊 Palavras contadas: {word_count}")
                total_words += word_count
            
            if total_words >= 28000:  # 93% do solicitado
                print(f"  ✅ APROVADO: {total_words} palavras totais")
                return True, total_words
            else:
                print(f"  ❌ REPROVADO: Apenas {total_words} palavras (esperado 30000)")
        else:
            print("  ❌ Nenhum arquivo de documentação encontrado")
            
        return False, 0
    
    def validate_task_5(self):
        """Valida landing page de clínica"""
        print("\n🔍 Validando Tarefa 5: Landing page para clínica odontológica")
        
        files = self.find_generated_files(min_age_seconds=300)
        
        landing_files = []
        for f in files:
            if any(ext in f.suffix.lower() for ext in ['.html', '.jsx', '.tsx', '.vue']):
                if any(keyword in f.name.lower() for keyword in ['landing', 'clinica', 'odonto', 'dental']):
                    landing_files.append(f)
        
        if not landing_files:
            # Procura em diretórios de projetos
            for root, dirs, files in os.walk(self.workspace):
                if 'node_modules' in root or '.git' in root:
                    continue
                if any(keyword in root.lower() for keyword in ['landing', 'clinica', 'odonto']):
                    for file in files:
                        if file.endswith('.html') or file == 'index.js':
                            landing_files.append(Path(root) / file)
        
        if landing_files:
            for landing in landing_files:
                content = landing.read_text(encoding='utf-8', errors='ignore')
                
                # Valida estrutura HTML
                has_header = '<header' in content or '<nav' in content
                has_sections = content.count('<section') >= 3
                has_form = '<form' in content or '<input' in content
                has_footer = '<footer' in content
                
                print(f"  📄 Arquivo: {landing.name}")
                print(f"  ✓ Header/Nav: {'✅' if has_header else '❌'}")
                print(f"  ✓ Seções (3+): {'✅' if has_sections else '❌'}")
                print(f"  ✓ Formulário: {'✅' if has_form else '❌'}")
                print(f"  ✓ Footer: {'✅' if has_footer else '❌'}")
                
                if has_header and has_sections and has_form:
                    print(f"  ✅ APROVADO: Landing page completa")
                    return True, landing
                else:
                    print(f"  ❌ REPROVADO: Landing page incompleta")
        else:
            print("  ❌ Nenhum arquivo de landing page encontrado")
            
        return False, None
    
    def run_tests(self):
        """Executa todos os testes"""
        print("=" * 70)
        print("🚀 INICIANDO TESTES DO FLUI CLI")
        print("=" * 70)
        
        tasks = [
            {
                'id': 1,
                'description': 'Gere um artigo COMPLETO sobre economia e juros com EXATAMENTE 16000 palavras. Inclua: introdução detalhada, história da economia, tipos de juros, políticas monetárias, impactos na sociedade, casos práticos, análises de mercado, perspectivas futuras, conclusão extensa. Escreva TODO o conteúdo, sem resumos.',
                'validator': self.validate_task_1
            },
            {
                'id': 2,
                'description': 'Crie um ebook COMPLETO sobre monetização no TikTok com EXATAMENTE 20000 palavras. Inclua todos os capítulos: introdução ao TikTok, algoritmo, nichos rentáveis, estratégias de conteúdo, parcerias, lives, TikTok Shop, casos de sucesso, ferramentas, métricas, escalonamento. Texto COMPLETO.',
                'validator': self.validate_task_2
            },
            {
                'id': 3,
                'description': 'Escreva um VSL (Video Sales Letter) COMPLETO para vender plano de saúde com EXATAMENTE 7000 palavras. Inclua: gancho inicial, identificação de dores, apresentação da solução, benefícios detalhados, depoimentos, garantias, oferta irresistível, call to action. Script COMPLETO.',
                'validator': self.validate_task_3
            },
            {
                'id': 4,
                'description': 'Desenvolva uma documentação COMPLETA sobre React JS com EXATAMENTE 30000 palavras. Cubra: fundamentos, componentes, props, state, hooks, context, routing, forms, performance, testing, deployment, best practices, projetos práticos. Documentação COMPLETA.',
                'validator': self.validate_task_4
            },
            {
                'id': 5,
                'description': 'Crie uma landing page COMPLETA para clínica odontológica. Inclua: header com menu, hero section, serviços, sobre nós, equipe, depoimentos, galeria, formulário de contato, mapa, footer. Use HTML5, CSS3, JavaScript. Código COMPLETO e funcional.',
                'validator': self.validate_task_5
            }
        ]
        
        results = []
        
        for task in tasks:
            print(f"\n{'='*70}")
            print(f"📋 TAREFA {task['id']}")
            print(f"{'='*70}")
            
            # Envia tarefa
            self.send_task_to_flui(task['description'])
            
            # Aguarda processamento
            print("⏳ Aguardando processamento...")
            time.sleep(30)  # Espera 30 segundos para processar
            
            # Valida resultado
            success, data = task['validator']()
            
            results.append({
                'task': task['id'],
                'success': success,
                'data': data
            })
            
            if not success:
                print(f"\n⚠️ Tarefa {task['id']} falhou. Tentando correção...")
                # Aqui implementaria lógica de retry/correção
        
        # Relatório final
        print("\n" + "=" * 70)
        print("📊 RELATÓRIO FINAL")
        print("=" * 70)
        
        for r in results:
            status = "✅ SUCESSO" if r['success'] else "❌ FALHA"
            print(f"Tarefa {r['task']}: {status}")
        
        success_rate = sum(1 for r in results if r['success']) / len(results) * 100
        print(f"\nTaxa de sucesso: {success_rate:.1f}%")
        
        if success_rate < 100:
            print("\n⚠️ Nem todas as tarefas foram concluídas com sucesso.")
            print("📝 Recomendações:")
            print("  1. Verificar configuração do modelo LLM")
            print("  2. Aumentar max_tokens para geração de conteúdo longo")
            print("  3. Implementar chunking para textos muito grandes")
            print("  4. Adicionar retry com prompts mais específicos")

if __name__ == "__main__":
    tester = FluiTester()
    tester.run_tests()