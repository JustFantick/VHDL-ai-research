library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity viterbi_decoder is
  port(
    clk    : in  std_logic;
    input  : in  std_logic_vector(1 downto 0);
    output : out bit
  );
end entity viterbi_decoder;

architecture rtl of viterbi_decoder is
  type word_2_t is array(1 downto 0) of std_logic_vector(1 downto 0);
  type word_4_next_state_t is array(3 downto 0) of std_logic_vector(1 downto 0);
  type word_3_t is array(2 downto 0) of std_logic_vector(1 downto 0);
  type word_3_bit_t is array(2 downto 0) of bit;
  type word_4_t is array(3 downto 0) of integer;
  type word_4_bit_t is array(3 downto 0) of bit;
  type memory_4_bit_t is array(3 downto 0) of word_4_bit_t;
  type memory_4_next_state_t is array(3 downto 0) of word_4_next_state_t;
  type memory_8_t is array(7 downto 0) of integer;
  type memory_traceback_row_t is array(7 downto 0) of word_3_t;
  type memory_traceback_table_t is array(3 downto 0) of memory_traceback_row_t;

  constant traceback_table : memory_traceback_table_t := (
    (("00", "00", "00"), ("11", "10", "11"), ("00", "11", "10"), ("11", "01", "01"), ("00", "00", "11"), ("11", "10", "00"), ("00", "11", "01"), ("11", "01", "10")),
    (("11", "00", "00"), ("00", "10", "11"), ("11", "11", "10"), ("00", "01", "01"), ("11", "00", "11"), ("00", "10", "00"), ("11", "11", "01"), ("00", "01", "10")),
    (("10", "11", "00"), ("01", "01", "11"), ("10", "00", "10"), ("01", "10", "01"), ("10", "11", "11"), ("01", "01", "00"), ("10", "00", "01"), ("01", "10", "10")),
    (("01", "11", "00"), ("10", "01", "11"), ("01", "00", "10"), ("10", "10", "01"), ("01", "11", "11"), ("10", "01", "00"), ("01", "00", "01"), ("10", "10", "10"))
  );

  constant output_table : memory_4_bit_t := (
    ('0', '0', '0', '1'),
    ('1', '0', '0', '0'),
    ('0', '1', '0', '0'),
    ('0', '0', '1', '0')
  );

  constant next_state_table : memory_4_next_state_t := (
    ("00", "00", "00", "10"),
    ("10", "00", "00", "00"),
    ("00", "11", "01", "00"),
    ("00", "01", "11", "00")
  );

  constant traceback_depth : positive := 3;

  function hamming_distance(a : std_logic_vector(1 downto 0)) return integer is
  begin
    case a is
      when "00" => return 0;
      when "01" => return 1;
      when "10" => return 1;
      when "11" => return 2;
      when others => return -1;
    end case;
  end function hamming_distance;

  FUNCTION conv_int(a : std_logic_vector(1 downto 0)) RETURN integer IS
  BEGIN
    CASE a IS
      WHEN "00" => RETURN 0;
      WHEN "01" => RETURN 1;
      WHEN "10" => RETURN 2;
      WHEN "11" => RETURN 3;
      WHEN OTHERS => RETURN -1;
    END CASE;
  END FUNCTION conv_int;

  signal initial_state : std_logic_vector(1 downto 0) := "00";
  signal traceback_result : memory_8_t := (others => 0);
  signal input_level : integer range 0 to 3 := 0;
  signal output_vector : word_3_bit_t;

begin
  process(clk)
    variable traceback_result_var : memory_8_t;
    variable chosen_path_index : integer range 0 to 7;
    variable lowest_path_metric_error : integer;
    variable current_state : std_logic_vector(1 downto 0);
    variable temp_output : std_logic_vector(1 downto 0);
    variable output_vector_var : word_3_bit_t;
    variable i : integer;
    variable addr_idx : integer;
  begin
    if rising_edge(clk) then
      if input /= "UU" then
        traceback_result_var := traceback_result;
        output_vector_var := output_vector;
        i := 0;

        addr_idx := 3 - conv_int(initial_state);

        while i < 8 loop
          traceback_result_var(i) := traceback_result_var(i) + hamming_distance(traceback_table(addr_idx)(7 - i)(2 - input_level) xor input);
          i := i + 1;
        end loop;

        output <= output_vector_var(input_level);

        if input_level = traceback_depth then
          i := 0;
          lowest_path_metric_error := 6;

          while i < 8 loop
            if lowest_path_metric_error > traceback_result_var(i) then
              lowest_path_metric_error := traceback_result_var(i);
              chosen_path_index := i;
            end if;
            i := i + 1;
          end loop;

          current_state := initial_state;
          i := 0;

          while i < traceback_depth loop
            temp_output := traceback_table(addr_idx)(7 - chosen_path_index)(2 - i);
            output_vector_var(i) := output_table(3 - conv_int(current_state))(3 - conv_int(temp_output));
            current_state := next_state_table(3 - conv_int(current_state))(3 - conv_int(temp_output));
            output_vector_var(i) := output_table(3 - conv_int(current_state))(3 - conv_int(temp_output));
            i := i + 1;
          end loop;

          addr_idx := 3 - conv_int(current_state);

          initial_state <= current_state;
          input_level <= 0;
          traceback_result <= (others => 0);
          output_vector <= output_vector_var;
        else
          traceback_result <= traceback_result_var;
          input_level <= input_level + 1;
        end if;
      end if;
    end if;
  end process;
end architecture rtl;
