import {} from "react";

interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  total_copies: number;
  available_copies: number;
}

const books: Book[] = [
  { id: 1, isbn: "978-0-7475-6862-6", title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "ROMANCE", total_copies: 5, available_copies: 3 },
  { id: 2, isbn: "978-0-452-28423-4", title: "1984", author: "George Orwell", genre: "SCIFI", total_copies: 4, available_copies: 0 },
  { id: 3, isbn: "978-0-441-17271-9", title: "Dune", author: "Frank Herbert", genre: "SCIFI", total_copies: 3, available_copies: 1 },
  { id: 4, isbn: "978-0-544-00000-0", title: "The Hobbit", author: "J.R.R. Tolkien", genre: "FANTASY", total_copies: 6, available_copies: 4 },
  { id: 5, isbn: "978-0-06-085052-8", title: "To Kill a Mockingbird", author: "Harper Lee", genre: "DRAMA", total_copies: 4, available_copies: 4 },
  { id: 6, isbn: "978-0-06-112008-4", title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "COMEDY", total_copies: 3, available_copies: 0 },
  { id: 7, isbn: "978-0-316-76917-0", title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", genre: "THRILLER", total_copies: 4, available_copies: 2 },
  { id: 8, isbn: "978-0-679-72325-1", title: "Pride and Prejudice", author: "Jane Austen", genre: "ROMANCE", total_copies: 3, available_copies: 3 },
  { id: 9, isbn: "978-0-06-501440-4", title: "The Handmaid's Tale", author: "Margaret Atwood", genre: "DRAMA", total_copies: 3, available_copies: 1 },
  { id: 10, isbn: "978-0-451-52493-5", title: "Fahrenheit 451", author: "Ray Bradbury", genre: "SCIFI", total_copies: 4, available_copies: 3 },
];

function availabilityPill(b: Book) {
  if (b.available_copies === 0) return <span className="pill pill-out">Out</span>;
  if (b.available_copies <= 1) return <span className="pill pill-low">{b.available_copies} left</span>;
  return <span className="pill pill-available">{b.available_copies}</span>;
}

function genreTag(g: string) {
  return <span className="genre-tag">{g.toLowerCase()}</span>;
}

export default function Books() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Books</h1>
          <div className="page-sub">{books.length} cataloged · inventory</div>
        </div>
        <button className="btn">+ Add Book</button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Copies</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                  </td>
                  <td className="text-muted">{b.author}</td>
                  <td className="mono text-muted">{b.isbn}</td>
                  <td>{genreTag(b.genre)}</td>
                  <td className="mono">{b.total_copies}</td>
                  <td>{availabilityPill(b)}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
