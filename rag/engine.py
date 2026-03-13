import os
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

class RAGEngine:
    def __init__(self, data_dir: str, persist_dir: str):
        self.data_dir = data_dir
        self.persist_dir = persist_dir
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = None

    def initialize(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            # Create a dummy file if empty
            with open(os.path.join(self.data_dir, "protocol.txt"), "w") as f:
                f.write("Standard Fire Response: Evacuate building, call fire department.\nStandard Flood Response: Move to high ground, avoid flood waters.")

        loader = DirectoryLoader(self.data_dir, glob="**/*.txt", loader_cls=TextLoader)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = text_splitter.split_documents(documents)
        
        self.vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_dir
        )
        print(f"RAG Engine initialized with {len(chunks)} document chunks.")

    def retrieve(self, query: str, k: int = 3):
        if not self.vector_store:
            self.initialize()
        return self.vector_store.similarity_search(query, k=k)
