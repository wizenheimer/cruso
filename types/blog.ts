// Blog types
export interface BlogPost {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    publishedAt: string;
    author: {
        name: string;
        email: string;
    };
    updatedAt?: string;
}

export interface BlogTag {
    name: string;
    count: number;
}
