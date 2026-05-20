import AddIcon from "@mui/icons-material/Add";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryIcon from "@mui/icons-material/Category";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EditIcon from "@mui/icons-material/Edit";
import GamepadIcon from "@mui/icons-material/SportsEsports";
import HomeIcon from "@mui/icons-material/Home";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SavingsIcon from "@mui/icons-material/Savings";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Box, Modal } from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "@/components/EmptyState";
import { CategoryResponse, TransactionType } from "@/types/finance";
import { enumLabel, getErrorMessage } from "@/utils/formatters";
import { api } from "@/utils/requests";

const transactionTypes: TransactionType[] = ["INCOME", "EXPENSE", "TRANSFER"];
const emptyForm = { name: "", type: "EXPENSE" as TransactionType, icon: "", color: "#2563EB", active: true };

type FilterOption = TransactionType | "";

function getCategoryIcon(category: CategoryResponse | typeof emptyForm) {
  const name = `${category.icon || ""} ${category.name || ""}`.toLowerCase();

  if (category.type === "INCOME") return <AttachMoneyIcon />;
  if (category.type === "TRANSFER") return <SavingsIcon />;
  if (name.includes("aliment") || name.includes("rest") || name.includes("mercado")) return <RestaurantIcon />;
  if (name.includes("moradia") || name.includes("casa") || name.includes("aluguel")) return <HomeIcon />;
  if (name.includes("transporte") || name.includes("carro") || name.includes("combust")) return <DirectionsCarIcon />;
  if (name.includes("lazer") || name.includes("game")) return <GamepadIcon />;
  if (name.includes("invest") || name.includes("reserva")) return <SavingsIcon />;
  return <CategoryIcon />;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [filter, setFilter] = useState<FilterOption>("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api
      .listCategories(filter || undefined)
      .then((res) => setCategories(res.data))
      .catch((error) => toast.error(getErrorMessage(error, "Não foi possível carregar as categorias.")));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return categories;
    return categories.filter((category) => `${category.name} ${category.icon || ""}`.toLowerCase().includes(normalizedSearch));
  }, [categories, search]);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditing(null);
    setModalOpen(false);
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const edit = useCallback((category: CategoryResponse) => {
    setEditing(category);
    setForm({ name: category.name, type: category.type, icon: category.icon || "", color: category.color || "#2563EB", active: category.active });
    setModalOpen(true);
  }, []);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);
      try {
        if (editing) {
          await api.updateCategory(editing.id, form);
          toast.success("Categoria atualizada.");
        } else {
          await api.createCategory(form);
          toast.success("Categoria criada.");
        }
        resetForm();
        load();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [editing, form, load, resetForm],
  );

  const deactivate = useCallback(
    async (id: number) => {
      try {
        await api.deactivateCategory(id);
        toast.success("Categoria desativada.");
        load();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [load],
  );

  return (
    <div className="mm-categories-page page-stack">
      <section className="module-heading-row">
        <div>
          <h1>Categorias</h1>
          <p>Gerencie seus fluxos financeiros por tipo e finalidade.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <AddIcon /> Nova categoria
        </button>
      </section>

      <section className="category-toolbar">
        <div className="pill-tabs">
          <button className={filter === "" ? "active" : ""} onClick={() => setFilter("")} type="button">
            Todas
          </button>
          {transactionTypes.map((type) => (
            <button className={filter === type ? "active" : ""} key={type} onClick={() => setFilter(type)} type="button">
              {enumLabel(type)}s
            </button>
          ))}
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Procurar categoria..." />
      </section>

      {filteredCategories.length ? (
        <section className="category-card-grid">
          {filteredCategories.map((category) => {
            const disabled = !category.active;
            return (
              <article className={`category-card ${disabled ? "disabled" : ""}`} key={category.id}>
                <div className="category-card-topline">
                  <span className="category-icon-box" style={{ background: `${category.color || "#2563EB"}22`, color: category.color || "#2563EB" }}>
                    {disabled ? <VisibilityOffIcon /> : getCategoryIcon(category)}
                  </span>
                  <span className={`category-toggle ${category.active ? "on" : "off"}`}>{category.active ? <CheckCircleIcon /> : <span />}</span>
                </div>

                <span className={`category-kind ${category.type.toLowerCase()}`}>{enumLabel(category.type)}</span>
                <h2>{category.name}</h2>
                <p>{category.systemDefault ? "Categoria padrão do sistema" : "Categoria personalizada"}</p>
                {category.icon && <small>Ícone: {category.icon}</small>}

                <div className="category-card-footer">
                  <button disabled={category.systemDefault} type="button" onClick={() => edit(category)} title="Editar categoria">
                    <EditIcon />
                  </button>
                  <button
                    disabled={category.systemDefault || !category.active}
                    type="button"
                    onClick={() => deactivate(category.id)}
                    title="Desativar categoria"
                  >
                    <DeleteOutlineOutlinedIcon />
                  </button>
                </div>
              </article>
            );
          })}

          <button className="category-add-card" type="button" onClick={openCreate}>
            <span>
              <AddIcon />
            </span>
            <strong>Adicionar personalizada</strong>
          </button>
        </section>
      ) : (
        <EmptyState title="Nenhuma categoria" message="Não existem categorias para o filtro selecionado." />
      )}

      <Modal open={modalOpen} onClose={resetForm} aria-labelledby="category-modal-title">
        <Box className="mm-modal-box compact-modal">
          <div className="modal-heading">
            <div>
              <span>
                <MoreHorizIcon /> Categoria
              </span>
              <h2 id="category-modal-title">{editing ? "Editar categoria" : "Nova categoria"}</h2>
            </div>
            <button type="button" onClick={resetForm}>
              <CloseIcon />
            </button>
          </div>

          <form className="modal-form" onSubmit={submit}>
            <label>Nome</label>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Alimentação, Salário, Viagem"
            />

            <label>Tipo</label>
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TransactionType })}>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {enumLabel(type)}
                </option>
              ))}
            </select>

            <label>Ícone textual</label>
            <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="restaurant, salary, car" />

            <label>Cor</label>
            <div className="color-input-row clean-color-row">
              <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
              <input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            </div>

            <label className="checkbox-row">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativa
            </label>

            <div className="form-actions modal-actions">
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={loading} type="submit">
                {editing ? "Salvar categoria" : "Criar categoria"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
