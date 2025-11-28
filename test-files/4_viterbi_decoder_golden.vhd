library ieee;
use ieee.std_logic_1164.all;

entity viterbi_decoder is
    port (
        input : in std_logic_vector(1 downto 0);
        clk : in std_logic;
        rst : in std_logic;
        output : out std_logic
    );
end viterbi_decoder;

architecture viterbi_decoder_behav of viterbi_decoder is
    type word_4_next_state is array (3 downto 0) of std_logic_vector(1 downto 0);
    type word_3 is array (2 downto 0) of std_logic_vector(1 downto 0);
    type word_3_std is array (2 downto 0) of std_logic;
    type word_4_std is array (3 downto 0) of std_logic;
    type memory_4_std is array (3 downto 0) of word_4_std;
    type memory_4_next_state is array (3 downto 0) of word_4_next_state;
    
    -- Constrained integer to save resources
    subtype metric_t is integer range 0 to 63; 
    type memory_8 is array (7 downto 0) of metric_t;
    
    type memory_traceback_row is array (7 downto 0) of word_3;
    type memory_traceback_table is array (3 downto 0) of memory_traceback_row;

    constant traceback_table : memory_traceback_table := (
        (("00", "00", "00"), ("11", "10", "11"), ("00", "11", "10"), ("11", "01", "01"), ("00", "00", "11"), ("11", "10", "00"), ("00", "11", "01"), ("11", "01", "10")),
        (("11", "00", "00"), ("00", "10", "11"), ("11", "11", "10"), ("00", "01", "01"), ("11", "00", "11"), ("00", "10", "00"), ("11", "11", "01"), ("00", "01", "10")),
        (("10", "11", "00"), ("01", "01", "11"), ("10", "00", "10"), ("01", "10", "01"), ("10", "11", "11"), ("01", "01", "00"), ("10", "00", "01"), ("01", "10", "10")),
        (("01", "11", "00"), ("10", "01", "11"), ("01", "00", "10"), ("10", "10", "01"), ("01", "11", "11"), ("10", "01", "00"), ("01", "00", "01"), ("10", "10", "10"))
    );

    constant output_table : memory_4_std := (
        ('0', '0', '0', '1'),
        ('1', '0', '0', '0'),
        ('0', '1', '0', '0'),
        ('0', '0', '1', '0')
    );

    constant next_state_table : memory_4_next_state := (
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
            when others => return 0;
        end case;
    end hamming_distance;

    function conv_int(a : std_logic_vector(1 downto 0)) return integer is
    begin
        case a is
            when "00" => return 0;
            when "01" => return 1;
            when "10" => return 2;
            when "11" => return 3;
            when others => return 0;
        end case;
    end conv_int;

begin
    process(clk, rst)
        variable initial_state : std_logic_vector(1 downto 0) := "00";
        variable traceback_result : memory_8 := (others => 0);
        variable input_level : integer range 0 to traceback_depth - 1 := 0;
        variable chosen_path_index : integer range 0 to 7 := 0;
        variable lowest_path_metric_error : integer range 0 to 2 * traceback_depth := 0;
        variable current_state : std_logic_vector(1 downto 0) := "00";
        variable output_vector : word_3_std := (others => '0');
        variable temp_output : std_logic_vector(1 downto 0) := "00";
        variable state_index : integer range 0 to 3 := 0;
        variable symbol_index : integer range 0 to 3 := 0;
    begin
        if rst = '1' then
            initial_state := "00";
            traceback_result := (others => 0);
            input_level := 0;
            chosen_path_index := 0;
            lowest_path_metric_error := 0;
            current_state := "00";
            output_vector := (others => '0');
            temp_output := "00";
            state_index := 0;
            symbol_index := 0;
            output <= '0';
        elsif rising_edge(clk) then
            -- Removed simulation-only check for "UU"
            state_index := 3 - conv_int(initial_state);
            for i in 0 to 7 loop
                -- Simplified access and metric accumulation
                traceback_result(i) := traceback_result(i) + hamming_distance(traceback_table(state_index)(7 - i)(2 - input_level) xor input);
            end loop;

            output <= output_vector(input_level);

            if input_level = traceback_depth - 1 then
                lowest_path_metric_error := 2 * traceback_depth;
                for i in 0 to 7 loop
                    if lowest_path_metric_error > traceback_result(i) then
                        lowest_path_metric_error := traceback_result(i);
                        chosen_path_index := i;
                    end if;
                end loop;

                current_state := initial_state;
                for i in 0 to traceback_depth - 1 loop
                    state_index := 3 - conv_int(current_state);
                    temp_output := traceback_table(state_index)(7 - chosen_path_index)(2 - i);
                    symbol_index := 3 - conv_int(temp_output);
                    output_vector(i) := output_table(state_index)(symbol_index);
                    current_state := next_state_table(state_index)(symbol_index);
                end loop;

                initial_state := current_state;
                input_level := 0;
                traceback_result := (others => 0);
            else
                input_level := input_level + 1;
            end if;
        end if;
    end process;
end viterbi_decoder_behav;
