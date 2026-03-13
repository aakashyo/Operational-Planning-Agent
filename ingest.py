import os
import glob
import torch
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def ingest_data(data_dir="data", persist_directory="data/chroma_db"):
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA Device: {torch.cuda.get_device_name(0)}")
        device = "cuda"
    else:
        print("WARNING: CUDA not available. Falling back to CPU for embedding.")
        device = "cpu"

    documents = []
    
    # Load PDFs
    for pdf_path in glob.glob(os.path.join(data_dir, "*.pdf")):
        print(f"Loading {pdf_path}...")
        try:
            loader = PyMuPDFLoader(pdf_path)
            documents.extend(loader.load())
        except Exception as e:
            print(f"Failed to load {pdf_path}: {e}")
            
    # Load TXTs
    for txt_path in glob.glob(os.path.join(data_dir, "*.txt")):
        if "protocols.txt" in txt_path:
            continue # skip the generated mock file if you want
        print(f"Loading {txt_path}...")
        try:
            loader = TextLoader(txt_path, encoding='utf-8')
            documents.extend(loader.load())
        except Exception as e:
            print(f"Failed to load {txt_path}: {e}")
            
    if not documents:
        print("No documents found to ingest!")
        return
        
    print(f"Loaded {len(documents)} document pages. Splitting text...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    docs = text_splitter.split_documents(documents)
    
    print(f"Created {len(docs)} chunks. Initializing embedding model on {device.upper()}...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": device}
    )
    
    print("Creating Chroma vector store... (This may take a few minutes)")
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    print(f"✅ Successfully ingested {len(docs)} chunks into {persist_directory} vectorstore.")

if __name__ == "__main__":
    ingest_data()
