import { AutoMap, classes } from "@automapper/classes";
import { CamelCaseNamingConvention, createMapper } from "@automapper/core";
import { Entity, IdentifiedReference, MikroORM, OneToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";

@Entity()
export class Author {
  @PrimaryKey()
  id: number;
  
  @OneToOne(() => Book, (book) => book.author, {
    wrappedReference: true
  })
  @AutoMap({ typeFn: () => Book })
  book: IdentifiedReference<Book>;

  @Property()
  @AutoMap()
  name: string;
}

@Entity()
export class Book {
  @PrimaryKey()
  id: number;
  
  @OneToOne(()=> Author, (author) => author.book, {
    owner: true,
    wrappedReference: true,
  })
  @AutoMap({typeFn: () => Author})
  author: IdentifiedReference<Author>;

  @Property()
  @AutoMap()
  name: string;
}

class AuthorDto {
  @AutoMap()
  name: string;
}

class BookDto {
  @AutoMap({ typeFn: () => AuthorDto})
  author: AuthorDto

  @AutoMap()
  name: string;
}

const main = async () => {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [Author, Book],
    dbName: 'auto-mapper-mikro-orm-sample',
    type: 'postgresql',
  });
  
  const mapper = createMapper({
    name: 'singleton-mapper',
    pluginInitializer: classes,
    namingConventions: new CamelCaseNamingConvention(),
  });

  try {
    mapper.createMap(Author, AuthorDto);
    mapper.createMap(Book, BookDto)

    const book = orm.em.create(Book, {id: 123, name: "John Doe"})
    const bookDto = mapper.map(book, BookDto, Book);

    console.log(bookDto);
  } finally {
    orm.close();
  }
}

main().catch(console.error);
