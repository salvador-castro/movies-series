import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { TitleDoc } from "./TitlesApp";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 14,
    textAlign: "center",
    color: "#666",
  },
  item: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: "1px solid #ddd",
  },
  index: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  line: {
    fontSize: 10,
    marginBottom: 2,
  },
  note: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: "italic",
  },
});

function kindLabel(k: TitleDoc["kind"]) {
  return k === "movie" ? "Película" : "Serie";
}

function stateLabel(s: TitleDoc["state"]) {
  if (s === "para_ver") return "Para ver";
  if (s === "viendo") return "Viendo";
  return "Vista";
}

export default function TitlesPDF({
  titles,
  filtersText,
}: {
  titles: TitleDoc[];
  filtersText?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Listado de películas y series</Text>
        <Text style={styles.subtitle}>{filtersText ? filtersText : `Total: ${titles.length}`}</Text>

        {titles.map((t, index) => (
          <View key={t._id} style={styles.item}>
            {/* Numeración */}
            <Text style={styles.index}>{index + 1}.</Text>

            {/* Título */}
            <Text style={styles.name}>{t.title}</Text>

            {/* Renglones separados */}
            <Text style={styles.line}>Tipo: {kindLabel(t.kind)}</Text>
            <Text style={styles.line}>Estado: {stateLabel(t.state)}</Text>
            <Text style={styles.line}>Rating: {typeof t.rating === "number" ? t.rating : "-"}</Text>
            <Text style={styles.line}>Plataforma: {t.platform ? t.platform : "-"}</Text>

            {/* Notas según estado */}
            {t.notePre ? <Text style={styles.note}>Descripción previa: {t.notePre}</Text> : null}

            {t.notePost ? <Text style={styles.note}>Opinión: {t.notePost}</Text> : null}
          </View>
        ))}
      </Page>
    </Document>
  );
}
